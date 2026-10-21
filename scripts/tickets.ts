#!/usr/bin/env tsx
/**
 * In-repo ticket system. Ticket files in tickets/ hold definitions and history;
 * the origin/ticket-ledger ref holds live claims and status so two developers
 * (and their agents) can never claim the same ticket. See docs/tickets.md.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { activity, criteria, parseTicket, serializeTicket } from "./tickets/format";
import { dashboardHtml } from "./tickets/dashboard";
import { REVIEW_BASE, reviewBodyProblems } from "./tickets/review";
import { ready } from "./tickets/graph";
import {
  git,
  ledgerMode,
  LedgerUnavailableError,
  mutateLedger,
  readLedger,
  run,
  stream,
  tryGit,
} from "./tickets/git";
import type { LedgerMode } from "./tickets/git";
import {
  branchHasTicket,
  ledgerKey,
  EPIC_KEYS,
  ESTIMATES,
  LABELS,
  MODULES,
  PRIORITIES,
  STATUSES,
  formatId,
  idNumber,
  slugify,
} from "./tickets/model";
import type { Frontmatter, LedgerData, Status, Ticket } from "./tickets/model";
import { renderList, renderTerminalBoard } from "./tickets/render";
import {
  effective,
  loadTickets,
  loadTicketsSafely,
  overlay,
  recordFrom,
  render,
  writeTicket,
} from "./tickets/store";
import { validateTickets } from "./tickets/validate";
import { TransitionError, claim, logLine, move, release } from "./tickets/workflow";
import type { MoveFacts } from "./tickets/workflow";

const USAGE = `Usage: pnpm t:<command>
  t:list [--status s] [--epic e] [--module m] [--owner o] [--label l] [--json]
  t:board                         live kanban (files + shared ledger)
  t:next [--module m] [--human]   best todo ticket with every blocker done
  t:show <id>
  t:claim <id> --owner <name> --agent <name>
  t:release <id>                  give back a claimed todo ticket
  t:move <id> <status> [--reason text] [--push]
  t:new --title "Imperative title" --epic e --module m [--priority p] [--estimate S|M|L]
        [--labels a,b] [--blocked-by TICKET-001,TICKET-002] [--status backlog|todo]
  t:pr <id>                       verify, push, open PR, move to in_review
  t:sync <id>                     sync only this branch’s ticket from the ledger
  t:validate                      schema, sections, ids, deps, cycles, consistency
  t:render                        generate ignored Markdown snapshots
  t:dashboard                     start the auto-refresh loopback board
  t:dashboard:snapshot            export the standalone HTML board`;

interface Args {
  positional: string[];
  flags: Record<string, string | true>;
}
function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  const flags: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] ?? "";
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const [key = "", inline] = arg.slice(2).split(/=(.*)/s);
    const next = argv[i + 1];
    if (inline !== undefined) flags[key] = inline;
    else if (next !== undefined && !next.startsWith("--")) {
      flags[key] = next;
      i++;
    } else flags[key] = true;
  }
  return { positional, flags };
}
const str = (args: Args, key: string): string | undefined =>
  typeof args.flags[key] === "string" ? (args.flags[key] as string) : undefined;

const root = () => git(["rev-parse", "--show-toplevel"], process.cwd());
const today = () => process.env.TICKETS_TODAY ?? new Date().toLocaleDateString("en-CA");
const currentBranch = (cwd: string) => tryGit(["branch", "--show-current"], cwd) ?? "";
/** Ticket files are only rewritten off main, so the coordination checkout stays clean. */
const canWriteFiles = (cwd: string, mode: LedgerMode) =>
  mode === "off" || !/^(main|master|develop|)$/.test(currentBranch(cwd));

function actor(args: Args, cwd: string): string {
  const value =
    // `||`, not `??`: an exported-but-empty AGENT_OWNER must fall through to git config.
    str(args, "owner") ||
    process.env.AGENT_OWNER ||
    tryGit(["config", "--get", "harness.owner"], cwd) ||
    "";
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,39}$/.test(value))
    throw new Error("Set who you are: --owner <name>, or once: git config harness.owner <name>.");
  return value;
}

interface State {
  cwd: string;
  mode: LedgerMode;
  files: Ticket[];
  ledger: LedgerData | null;
  tickets: Ticket[];
  live: boolean;
}
function load(readOnly: boolean): State {
  const cwd = root();
  const mode = ledgerMode();
  const files = loadTickets(cwd);
  let ledger: LedgerData | null = null;
  let live = mode === "off";
  try {
    ledger = readLedger(cwd, mode)?.data ?? null;
    live = true;
  } catch (error) {
    if (!(error instanceof LedgerUnavailableError) || !readOnly) throw error;
    console.warn(`⚠ ${error.message} Showing committed ticket files only.`);
  }
  return { cwd, mode, files, ledger, tickets: effective(files, ledger), live };
}

function find(state: State, id: string): Ticket {
  const normalised = /^\d+$/.test(id)
    ? formatId(Number(id))
    : id.toUpperCase().replace(/^WED-/, "TICKET-");
  const ticket = state.tickets.find((t) => t.meta.id === normalised);
  if (!ticket) throw new Error(`Unknown ticket ${id}.`);
  return ticket;
}

/** Persist a ticket change: shared ledger first (atomic), then this checkout's file and boards. */
function commitChange(
  state: State,
  id: string,
  apply: (
    current: Ticket,
    statusOf: (id: string) => Status | undefined,
  ) => { meta: Partial<Frontmatter>; log: string },
): Ticket {
  const fileTicket = state.files.find((t) => t.meta.id === id);
  if (!fileTicket) throw new Error(`Unknown ticket ${id}.`);
  let updated: Ticket;
  if (state.mode === "off") {
    const statusOf = (x: string) => state.tickets.find((t) => t.meta.id === x)?.meta.status;
    const { meta, log } = apply(fileTicket, statusOf);
    updated = withLog({ ...fileTicket, meta: { ...fileTicket.meta, ...meta } }, log);
  } else {
    updated = mutateLedger(state.cwd, state.mode, (data) => {
      const fresh = effective(state.files, data);
      const current = fresh.find((t) => t.meta.id === id) ?? fileTicket;
      const statusOf = (x: string) => fresh.find((t) => t.meta.id === x)?.meta.status;
      const { meta, log } = apply(current, statusOf);
      const record = {
        ...(data.tickets[ledgerKey(id)] ?? { ...recordFrom(current), log: [] }),
        ...pickLedger(meta),
      };
      record.log = [...(data.tickets[ledgerKey(id)]?.log ?? []), log];
      data.tickets[ledgerKey(id)] = record;
      data.lastId = Math.max(data.lastId, ...state.files.map((t) => idNumber(t.meta.id)));
      return { result: overlay(fileTicket, record), message: `${id}: ${log.replace(/^- /, "")}` };
    });
  }
  if (canWriteFiles(state.cwd, state.mode) && branchHasTicket(currentBranch(state.cwd), id)) {
    writeTicket(state.cwd, updated);
  } else
    console.log(
      `Recorded in the shared ledger. ${id}'s file is updated when you run t:move in its worktree (this checkout is on ${currentBranch(state.cwd) || "a detached HEAD"}).`,
    );
  return updated;
}
function withLog(ticket: Ticket, line: string): Ticket {
  const lines = activity(ticket);
  if (!lines.includes(line)) lines.push(line);
  return { ...ticket, sections: { ...ticket.sections, "Activity log": lines.join("\n") } };
}
function pickLedger(meta: Partial<Frontmatter>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta))
    if (
      [
        "status",
        "owner",
        "agent",
        "branch",
        "pr",
        "started",
        "completed",
        "updated",
        "reason",
        "resume_to",
      ].includes(k)
    )
      out[k] = v;
  return out;
}

/** Explicitly sync only the branch's own ticket. Reads never sync files. */
function syncFiles(state: State, id: string): string[] {
  if (!branchHasTicket(currentBranch(state.cwd), id))
    throw new Error(`Run t:sync ${id} on its own ticket branch.`);
  const file = state.files.find((t) => t.meta.id === id);
  if (!file) throw new Error(`Unknown ticket ${id}.`);
  const record = state.ledger?.tickets[ledgerKey(id)];
  if (!record) return [];
  const next = overlay(file, record);
  if (serializeTicket(next) === serializeTicket(file)) return [];
  writeTicket(state.cwd, next);
  return [file.path];
}

function pushTickets(cwd: string, id: string, message: string) {
  const ticket = loadTickets(cwd).find((t) => t.meta.id === id);
  if (!ticket) throw new Error(`Unknown ticket ${id}.`);
  const staged = git(["diff", "--cached", "--name-only"], cwd).split("\n").filter(Boolean);
  if (staged.some((path) => path !== ticket.path))
    throw new Error("Commit other staged work separately before pushing a ticket status.");
  git(["add", ticket.path], cwd);
  if (!tryGit(["diff", "--cached", "--quiet"], cwd)) {
    if (!stream("git", ["commit", "-m", `${id}: ${message}`], cwd))
      throw new Error("Commit failed (see hook output).");
  }
  if (!stream("git", ["push", "-u", "origin", "HEAD"], cwd)) throw new Error("Push failed.");
}

function prFor(
  cwd: string,
  ref: string,
): { url: string; state: string; baseRefName: string } | null {
  try {
    return JSON.parse(run("gh", ["pr", "view", ref, "--json", "url,state,baseRefName"], cwd)) as {
      url: string;
      state: string;
      baseRefName: string;
    };
  } catch {
    return null;
  }
}

function gatherFacts(
  state: State,
  ticket: Ticket,
  to: Status,
  args: Args,
  verify: boolean,
): MoveFacts {
  const cwd = state.cwd;
  const statusOf = (x: string) => state.tickets.find((t) => t.meta.id === x)?.meta.status;
  const facts: MoveFacts = {
    actor: actor(args, cwd),
    agent: str(args, "agent") || process.env.TICKETS_AGENT || ticket.meta.agent,
    today: today(),
    reason: str(args, "reason"),
    statusOf,
    branch:
      state.mode === "off" && !tryGit(["remote", "get-url", "origin"], cwd)
        ? undefined
        : currentBranch(cwd),
  };
  if (to === "in_review") {
    facts.criteriaTicked = criteria(ticket).every((c) => c.checked);
    facts.clean = git(["status", "--porcelain"], cwd) === "";
    const head = git(["rev-parse", "HEAD"], cwd);
    tryGit(["fetch", "--quiet", "origin", currentBranch(cwd)], cwd);
    facts.pushed = tryGit(["rev-parse", `refs/remotes/origin/${currentBranch(cwd)}`], cwd) === head;
    const pr = prFor(cwd, currentBranch(cwd));
    facts.openPr = pr?.state === "OPEN" && pr.baseRefName === REVIEW_BASE ? pr.url : undefined;
    facts.verified = process.env.TICKETS_VERIFIED_SHA === head || !verify;
  }
  if (to === "done") {
    const pr = prFor(cwd, ticket.meta.pr || ticket.meta.branch);
    facts.mergedPr = pr?.state === "MERGED" && pr.baseRefName === REVIEW_BASE ? pr.url : undefined;
    // Criteria are judged on what actually merged.
    let merged = ticket;
    if (tryGit(["fetch", "--quiet", "origin", REVIEW_BASE], cwd) !== null) {
      const text =
        tryGit(["show", `refs/remotes/origin/${REVIEW_BASE}:${ticket.path}`], cwd) ??
        tryGit(["show", `FETCH_HEAD:${ticket.path}`], cwd);
      if (text) merged = parseTicket(text, ticket.path);
    }
    facts.criteriaTicked = criteria(merged).every((c) => c.checked);
  }
  return facts;
}

function doMove(state: State, id: string, to: Status, args: Args): Ticket {
  const ticket = find(state, id);
  // Cheap checks first; pnpm verify only runs once everything else is ready.
  const dry = gatherFacts(state, ticket, to, args, false);
  move(ticket.meta, to, dry);
  if (to === "in_review" && !dry.verified) {
    const head = git(["rev-parse", "HEAD"], state.cwd);
    console.log("Running pnpm verify before review…");
    if (!stream("pnpm", ["verify"], state.cwd))
      throw new TransitionError("pnpm verify failed; fix it before review.");
    process.env.TICKETS_VERIFIED_SHA = head;
  }
  const result = commitChange(state, ticket.meta.id, (current, statusOf) => {
    const facts = { ...gatherFacts(state, current, to, args, true), statusOf };
    if (to === "in_review") Object.assign(facts, { verified: true });
    const change = move(current.meta, to, facts);
    return {
      meta: change,
      log: logLine(facts.today, current.meta.status, to, facts.actor, facts.agent, facts.reason),
    };
  });
  console.log(`${result.meta.id}: ${to}`);
  if (args.flags.push) pushTickets(state.cwd, result.meta.id, `move to ${to}`);
  else if (canWriteFiles(state.cwd, state.mode) && to !== "done")
    console.log(
      `Commit and push now: git add tickets && git commit -m "${result.meta.id}: move to ${to}" && git push`,
    );
  return result;
}

function newTicket(args: Args): void {
  const cwd = root();
  const mode = ledgerMode();
  const title = str(args, "title");
  const epic = str(args, "epic");
  const moduleKey = str(args, "module");
  if (!title || !epic || !moduleKey)
    throw new Error('t:new needs --title "…" --epic <epic> --module <module>.');
  const template = parseTicket(
    readFileSync(join(cwd, "tickets/TEMPLATE.md"), "utf8"),
    "tickets/TEMPLATE.md",
  );
  const files = loadTickets(cwd);
  // Ids also come from main and the ledger, so parallel branches never reuse a number.
  tryGit(["fetch", "--quiet", "origin", REVIEW_BASE], cwd);
  const onMain = (
    tryGit(["ls-tree", "--name-only", `refs/remotes/origin/${REVIEW_BASE}`, "tickets/"], cwd) ?? ""
  )
    .split("\n")
    .map((p) => /(?:TICKET|WED)-(\d{3})/.exec(p)?.[1])
    .filter((n): n is string => !!n)
    .map(Number);
  const localMax = Math.max(0, ...files.map((t) => idNumber(t.meta.id)), ...onMain);
  const number =
    mode === "off"
      ? localMax + 1
      : mutateLedger(cwd, mode, (data) => {
          data.lastId = Math.max(data.lastId, localMax) + 1;
          return { result: data.lastId, message: `allocate ${formatId(data.lastId)}` };
        });
  const id = formatId(number);
  const date = today();
  const list = (key: string) =>
    (str(args, key) ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  const meta = {
    ...template.meta,
    id,
    title,
    epic,
    module: moduleKey,
    status: str(args, "status") ?? "backlog",
    priority: str(args, "priority") ?? "medium",
    estimate: str(args, "estimate") ?? "M",
    labels: list("labels").length ? list("labels") : template.meta.labels,
    blocked_by: list("blocked-by"),
    blocks: [],
    created: date,
    updated: date,
  };
  const ticket: Ticket = {
    meta: meta as Frontmatter,
    path: `tickets/${id}-${slugify(title)}.md`,
    sections: {
      ...template.sections,
      "Activity log": logLine(
        date,
        "new",
        meta.status as Status,
        actor(args, cwd),
        process.env.TICKETS_AGENT ?? "",
      ),
    },
  };
  // Round-trip through the parser so invalid enums fail before anything is written.
  parseTicket(serializeTicket(ticket), ticket.path);
  writeFileSync(join(cwd, ticket.path), serializeTicket(ticket));
  console.log(`Created ${ticket.path}. Fill in every section, then commit it with your branch.`);
}

function validate(): number {
  const cwd = root();
  const { tickets, errors } = loadTicketsSafely(cwd);
  const problems = [...errors, ...validateTickets(tickets)];
  if (!existsSync(join(cwd, "tickets/TEMPLATE.md")))
    problems.push("tickets/TEMPLATE.md is missing");
  if (existsSync(join(cwd, "docs/tasks.json")))
    problems.push("docs/tasks.json was replaced by tickets/; delete it");
  if (problems.length) {
    console.error(
      `✖ ${problems.length} ticket problem(s):\n${problems.map((p) => `  - ${p}`).join("\n")}`,
    );
    return 1;
  }
  console.log(`✔ ${tickets.length} tickets valid.`);
  return 0;
}

function main(): number {
  const [command = "help", ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  switch (command) {
    case "list": {
      const state = load(true);
      const f = (k: string) => str(args, k);
      const metas = state.tickets
        .map((t) => t.meta)
        .filter(
          (m) =>
            (!f("status") || f("status")?.split(",").includes(m.status)) &&
            (!f("epic") || m.epic === f("epic")) &&
            (!f("module") || m.module === f("module")) &&
            (!f("owner") || m.owner === f("owner")) &&
            (!f("label") || m.labels.includes(f("label") as Frontmatter["labels"][number])),
        );
      console.log(args.flags.json ? JSON.stringify(metas, null, 2) : renderList(metas));
      return 0;
    }
    case "dashboard": {
      const state = load(true);
      const source =
        state.mode === "off"
          ? "Local files only (ledger disabled)"
          : state.live
            ? "Ledger snapshot (refresh to update)"
            : "OFFLINE — committed files only; status may be stale";
      const base =
        tryGit(["rev-parse", "--short", "refs/remotes/origin/develop"], state.cwd) ?? "unknown";
      if (args.flags.json) {
        console.log(
          JSON.stringify({
            tickets: state.tickets,
            source: state.live && state.mode === "origin" ? "Shared ledger" : source,
            base,
            generated: new Date().toISOString(),
            connected: state.live,
          }),
        );
        return 0;
      }
      const output = join(state.cwd, "artifacts/tickets/index.html");
      mkdirSync(join(state.cwd, "artifacts/tickets"), { recursive: true });
      writeFileSync(output, dashboardHtml(state.tickets, source, base));
      console.log(`${source}\nOpen ${output}`);
      return 0;
    }
    case "board": {
      const state = load(true);
      console.log(renderTerminalBoard(state.tickets.map((t) => t.meta)));
      if (!state.live) console.log("\n(ledger unavailable: committed files only)");
      return 0;
    }
    case "next": {
      const state = load(true);
      const metas = state.tickets.map((t) => t.meta);
      const picks = ready(metas, {
        module: str(args, "module"),
        onlyHuman: args.flags.human === true,
      });
      const pick = picks[0];
      if (!pick) {
        console.log("No ready ticket. Check pnpm t:board for blocked or in-flight work.");
        return 0;
      }
      if (args.flags.json) console.log(JSON.stringify(pick, null, 2));
      else {
        const t = state.tickets.find((x) => x.meta.id === pick.id);
        console.log(
          `${pick.id} · ${pick.priority} · ${pick.estimate} · ${pick.module}\n${t?.meta.title}\n${t?.path}\n\nClaim it: pnpm t:claim ${pick.id} --owner <you> --agent <agent>`,
        );
      }
      return 0;
    }
    case "show": {
      const state = load(true);
      const t = find(state, args.positional[0] ?? "");
      console.log(
        args.flags.json ? JSON.stringify({ ...t.meta, path: t.path }, null, 2) : serializeTicket(t),
      );
      return 0;
    }
    case "claim": {
      const state = load(false);
      const id = find(state, args.positional[0] ?? "").meta.id;
      const who = actor(args, state.cwd);
      const agent = str(args, "agent") || process.env.TICKETS_AGENT || "";
      const t = commitChange(state, id, (current, statusOf) => {
        const branch = id;
        const change = claim(current.meta, { actor: who, agent, today: today(), statusOf }, branch);
        return { meta: change, log: logLine(today(), current.meta.status, "claimed", who, agent) };
      });
      console.log(
        `Claimed ${id} for ${who} (${agent}). Branch: ${t.meta.branch}\nNext: pnpm wt:new ${id}`,
      );
      return 0;
    }
    case "release": {
      const state = load(false);
      const id = find(state, args.positional[0] ?? "").meta.id;
      const who = actor(args, state.cwd);
      commitChange(state, id, (current) => ({
        meta: release(current.meta, {
          actor: who,
          agent: "",
          today: today(),
          statusOf: () => undefined,
        }),
        log: logLine(
          today(),
          current.meta.status,
          "released",
          who,
          current.meta.agent,
          str(args, "reason"),
        ),
      }));
      console.log(`Released ${id}.`);
      return 0;
    }
    case "move": {
      const [id = "", to = ""] = args.positional;
      if (!(STATUSES as readonly string[]).includes(to))
        throw new Error(`Status must be one of ${STATUSES.join(", ")}.`);
      doMove(load(false), id, to as Status, args);
      return 0;
    }
    case "pr": {
      const state = load(false);
      const ticket = find(state, args.positional[0] ?? "");
      const id = ticket.meta.id;
      const branch = currentBranch(state.cwd);
      if (!branchHasTicket(branch, id)) throw new Error(`Run t:pr inside ${id}'s worktree.`);
      if (ticket.meta.status !== "in_progress")
        throw new Error(`${id} must be in_progress (it is ${ticket.meta.status}).`);
      if (!criteria(ticket).every((c) => c.checked))
        throw new Error(`Tick every acceptance criterion in ${ticket.path} first.`);
      if (git(["status", "--porcelain"], state.cwd)) throw new Error("Commit all work first.");
      const body = join(state.cwd, "docs/plans", `${id}-pr.md`);
      if (!existsSync(body))
        throw new Error(
          `Write ${body} from .github/pull_request_template.md (with evidence) and commit it, then retry.`,
        );
      const bodyProblems = reviewBodyProblems(readFileSync(body, "utf8"));
      if (bodyProblems.length) throw new Error(bodyProblems.join("\n"));
      const currentPr = prFor(state.cwd, branch);
      if (currentPr && currentPr.baseRefName !== REVIEW_BASE)
        throw new Error(`Retarget this ticket PR to ${REVIEW_BASE} before continuing.`);
      console.log("Running pnpm verify…");
      if (!stream("pnpm", ["verify"], state.cwd)) throw new Error("pnpm verify failed.");
      process.env.TICKETS_VERIFIED_SHA = git(["rev-parse", "HEAD"], state.cwd);
      if (!stream("git", ["push", "-u", "origin", "HEAD"], state.cwd))
        throw new Error("Push failed.");
      const existing = prFor(state.cwd, branch);
      if (existing) run("gh", ["pr", "edit", existing.url, "--body-file", body], state.cwd);
      if (!existing) {
        run(
          "gh",
          [
            "pr",
            "create",
            "--base",
            REVIEW_BASE,
            "--head",
            branch,
            "--title",
            `${id}: ${ticket.meta.title}`,
            "--body-file",
            body,
          ],
          state.cwd,
        );
      }
      doMove(load(false), id, "in_review", { ...args, flags: { ...args.flags, push: true } });
      console.log(prFor(state.cwd, branch)?.url ?? "");
      return 0;
    }
    case "new":
      newTicket(args);
      return 0;
    case "sync": {
      const state = load(false);
      if (!canWriteFiles(state.cwd, state.mode))
        throw new Error("Run t:sync on a ticket branch, never on main or develop.");
      const id = find(state, args.positional[0] ?? currentBranch(state.cwd)).meta.id;
      const changed = syncFiles(state, id);
      console.log(
        changed.length ? `Synced: ${changed.join(", ")}` : "Ticket files already match the ledger.",
      );
      return 0;
    }
    case "validate":
      return validate();
    case "render": {
      if (args.flags.staged) {
        console.log("Snapshots are local output; nothing to stage.");
        return 0;
      }
      const state = load(true);
      const changed = render(state.cwd, state.tickets);
      console.log(
        changed.length ? `Rendered: ${changed.join(", ")}` : "Boards already up to date.",
      );
      return 0;
    }
    default:
      console.log(USAGE);
      console.log(
        `\nEpics: ${EPIC_KEYS.join(", ")}\nModules: ${MODULES.join(", ")}\nLabels: ${LABELS.join(", ")}\nPriorities: ${PRIORITIES.join(", ")} · Estimates: ${ESTIMATES.join(", ")}`,
      );
      return command === "help" ? 0 : 1;
  }
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(
    error instanceof TransitionError ? `✖ ${error.message}` : `✖ ${(error as Error).message}`,
  );
  process.exitCode = 1;
}
