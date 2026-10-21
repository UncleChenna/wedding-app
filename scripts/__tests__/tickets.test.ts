import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { isolatedGitEnv } from "./git-env";
import { attributionProblems, cleanMessage, ticketProblems } from "../harness/commit-rules.mjs";
import { criteria, parseTicket, serializeTicket } from "../tickets/format";
import { criticalPath, findCycle, ready, upcoming } from "../tickets/graph";
import { SECTIONS } from "../tickets/model";
import type { Frontmatter, SectionName, Ticket } from "../tickets/model";
import { effective, loadTicketsSafely, recordFrom, renderOutputs } from "../tickets/store";
import { validateTickets } from "../tickets/validate";
import { claim, move, release } from "../tickets/workflow";
import type { MoveFacts } from "../tickets/workflow";

function ticket(id: string, overrides: Partial<Frontmatter> = {}, ticked = false): Ticket {
  const meta: Frontmatter = {
    id,
    title: `Build thing ${id}`,
    epic: "foundations",
    status: "todo",
    priority: "medium",
    estimate: "M",
    labels: ["backend"],
    module: "shared",
    owner: "",
    agent: "",
    blocked_by: [],
    blocks: [],
    branch: "",
    pr: "",
    created: "2026-10-21",
    updated: "2026-10-21",
    started: "",
    completed: "",
    reason: "",
    resume_to: "",
    ...overrides,
  };
  const sections = Object.fromEntries(SECTIONS.map((s) => [s, "- Something."])) as Record<
    SectionName,
    string
  >;
  sections.Context = "See [the PRD](../docs/prd.md#gate-check-in).";
  sections["Acceptance criteria"] = `- [${ticked ? "x" : " "}] It works when tested.`;
  sections["Test plan"] = "- Unit: vitest covers it.";
  sections["Activity log"] = "- 2026-10-21 — new → todo — test";
  return { meta, sections, path: `tickets/${id}-build-thing.md` };
}

/** Fill derived `blocks` fields so tests focus on the rule under test. */
const withBlocks = (tickets: Ticket[]) => renderOutputs(tickets).tickets;

const facts = (overrides: Partial<MoveFacts> = {}): MoveFacts => ({
  actor: "divine",
  agent: "claude",
  today: "2026-10-22",
  statusOf: () => "done",
  ...overrides,
});

describe("ticket file format", () => {
  it("preserves an existing owner's claim under the renamed ID", () => {
    const current = ticket("TICKET-001");
    const claimed = ticket("TICKET-001", {
      owner: "alice",
      status: "in_progress",
      branch: "alice/WED-001-existing",
    });
    const [live] = effective([current], {
      version: 1,
      lastId: 186,
      tickets: { "WED-001": recordFrom(claimed) },
    });
    if (!live) throw new Error("Expected the renamed ticket to be preserved");
    expect(live.meta.id).toBe("TICKET-001");
    expect(live.meta.owner).toBe("alice");
    expect(live.meta.branch).toBe("alice/WED-001-existing");
    expect(ready([live.meta])).toEqual([]);
    expect(validateTickets([live]).filter((problem) => problem.includes("branch"))).toEqual([]);
  });
  it("allows the backlog audit while rejecting unexpected Markdown files", () => {
    const root = mkdtempSync(join(tmpdir(), "ticket-audit-"));
    try {
      mkdirSync(join(root, "tickets"));
      writeFileSync(join(root, "tickets/AUDIT.md"), "# Backlog audit\n");
      const sample = ticket("TICKET-001");
      writeFileSync(join(root, sample.path), serializeTicket(sample));
      expect(loadTicketsSafely(root).errors).toEqual([]);
      expect(loadTicketsSafely(root).tickets).toHaveLength(1);
      writeFileSync(join(root, "tickets/stray.md"), "# Not a ticket\n");
      expect(loadTicketsSafely(root).errors).toEqual([
        "tickets/stray.md: ticket files are named TICKET-NNN-slug.md",
      ]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
  it("round-trips exactly, including quoted titles", () => {
    const t = ticket("TICKET-001", {
      title: "Fix hooks: symlinked skills dir",
      blocked_by: ["TICKET-002"],
    });
    const text = serializeTicket(t);
    const parsed = parseTicket(text, t.path);
    expect(parsed.meta).toEqual(t.meta);
    expect(serializeTicket(parsed)).toBe(text);
  });

  it("rejects bad enums, missing sections and mismatched headings", () => {
    const text = serializeTicket(ticket("TICKET-001"));
    expect(() =>
      parseTicket(text.replace("priority: medium", "priority: whenever"), "x.md"),
    ).toThrow(/priority/);
    expect(() => parseTicket(text.replace("## Test plan", "## Testing"), "x.md")).toThrow(
      /Test plan/,
    );
    expect(() =>
      parseTicket(text.replace("# TICKET-001: Build", "# TICKET-001: Make"), "x.md"),
    ).toThrow(/heading/);
    expect(() => parseTicket(text.replace("estimate: M", "estimate: XL"), "x.md")).toThrow(
      /estimate/,
    );
  });

  it("reads acceptance criteria checkboxes", () => {
    expect(criteria(ticket("TICKET-001", {}, true))).toEqual([
      { checked: true, text: "It works when tested." },
    ]);
  });
});

describe("backlog validation", () => {
  it("accepts a consistent backlog", () => {
    const tickets = withBlocks([
      ticket("TICKET-001"),
      ticket("TICKET-002", { blocked_by: ["TICKET-001"] }),
    ]);
    expect(validateTickets(tickets).filter((p) => !p.includes("milestone"))).toEqual([]);
  });

  it("finds duplicates, gaps, dangling deps, stale blocks and cycles", () => {
    const problems = validateTickets([
      ticket("TICKET-001"),
      ticket("TICKET-001"),
      ticket("TICKET-003", { blocked_by: ["TICKET-005"] }),
      ticket("TICKET-004", { blocked_by: ["TICKET-009"] }),
      ticket("TICKET-005", { blocked_by: ["TICKET-003"] }),
    ]).join("\n");
    expect(problems).toMatch(/duplicate id/);
    expect(problems).toMatch(/missing TICKET-002/);
    expect(problems).toMatch(/TICKET-009 does not exist/);
    expect(problems).toMatch(/blocks must be/);
    expect(problems).toMatch(/cycle/);
  });

  it("ties statuses to owners, branches, PRs and ticked criteria", () => {
    const problems = validateTickets(
      withBlocks([
        ticket("TICKET-001", { status: "in_progress" }),
        ticket("TICKET-002", {
          status: "in_review",
          owner: "divine",
          agent: "claude",
          branch: "divine/TICKET-002-x",
          started: "2026-10-21",
        }),
        ticket("TICKET-003", { status: "blocked" }),
        ticket("TICKET-004", { branch: "divine/other" }),
      ]),
    ).join("\n");
    expect(problems).toMatch(/TICKET-001: in_progress tickets need owner and agent/);
    expect(problems).toMatch(/TICKET-002: in_review tickets need a PR link/);
    expect(problems).toMatch(
      /TICKET-002: in_review tickets need every acceptance criterion ticked/,
    );
    expect(problems).toMatch(/TICKET-003: blocked tickets need reason and resume_to/);
    expect(problems).toMatch(/TICKET-004: branch divine\/other must contain TICKET-004/);
  });
});

describe("transition rules", () => {
  const todo = ticket("TICKET-005", { blocked_by: ["TICKET-001"] }).meta;

  it("claims once, only when every blocker is done, and only the owner releases", () => {
    const change = claim(todo, facts(), "divine/TICKET-005-x");
    expect(change).toMatchObject({ owner: "divine", agent: "claude" });
    const claimed = { ...todo, ...change };
    expect(() => claim(claimed, facts({ actor: "friend" }), "b")).toThrow(/already claimed/);
    expect(() => claim(todo, facts({ statusOf: () => "in_review" }), "b")).toThrow(
      /blocked by TICKET-001/,
    );
    expect(() => release(claimed, facts({ actor: "friend" }))).toThrow(/belongs to divine/);
    expect(release(claimed, facts())).toMatchObject({ owner: "" });
  });

  it("rejects transitions outside the table", () => {
    expect(() => move(todo, "done", facts())).toThrow(/not allowed/);
    expect(() => move({ ...todo, status: "backlog" }, "in_progress", facts())).toThrow(
      /not allowed/,
    );
    expect(() => move({ ...todo, status: "done" }, "cancelled", facts())).toThrow(/not allowed/);
  });

  it("starts work only when claimed, unblocked and on the ticket branch", () => {
    const claimed = { ...todo, owner: "divine", agent: "claude", branch: "divine/TICKET-005-x" };
    expect(() => move(todo, "in_progress", facts())).toThrow(/Claim/);
    expect(() => move(claimed, "in_progress", facts({ statusOf: () => "todo" }))).toThrow(
      /blocked by/,
    );
    expect(() => move(claimed, "in_progress", facts({ branch: "main" }))).toThrow(/worktree/);
    expect(() => move(claimed, "in_progress", facts({ actor: "friend" }))).toThrow(
      /belongs to divine/,
    );
    expect(move(claimed, "in_progress", facts({ branch: "divine/TICKET-005-x" }))).toMatchObject({
      status: "in_progress",
      started: "2026-10-22",
    });
  });

  it("requires ticked criteria, clean pushed verified work and an open PR for review", () => {
    const active = {
      ...todo,
      status: "in_progress" as const,
      owner: "divine",
      branch: "divine/TICKET-005-x",
    };
    const ok = {
      branch: active.branch,
      criteriaTicked: true,
      clean: true,
      pushed: true,
      verified: true,
      openPr: "https://github.com/o/r/pull/1",
    };
    expect(move(active, "in_review", facts(ok))).toMatchObject({ pr: ok.openPr });
    for (const [key, message] of [
      ["criteriaTicked", /Tick every/],
      ["clean", /not clean/],
      ["verified", /verify/],
      ["pushed", /Push/],
      ["openPr", /PR/],
    ] as const)
      expect(() => move(active, "in_review", facts({ ...ok, [key]: undefined }))).toThrow(message);
  });

  it("marks done only after merge, and review can send work back with a reason", () => {
    const review = {
      ...todo,
      status: "in_review" as const,
      owner: "divine",
      branch: "divine/TICKET-005-x",
    };
    expect(() => move(review, "done", facts({ criteriaTicked: true }))).toThrow(/not merged/);
    expect(
      move(review, "done", facts({ criteriaTicked: true, mergedPr: "https://x.test/1" })),
    ).toMatchObject({
      status: "done",
      completed: "2026-10-22",
    });
    expect(() => move(review, "in_progress", facts({ branch: review.branch }))).toThrow(/reason/);
  });

  it("blocks with a reason and only resumes to the previous status", () => {
    const active = { ...todo, status: "in_progress" as const, owner: "divine" };
    expect(() => move(active, "blocked", facts())).toThrow(/reason/);
    const change = move(active, "blocked", facts({ reason: "Waiting on venue Wi-Fi details" }));
    expect(change).toMatchObject({ resume_to: "in_progress" });
    const blocked = { ...active, ...change } as Frontmatter;
    expect(() => move(blocked, "todo", facts())).toThrow(/only return/);
    expect(move(blocked, "in_progress", facts())).toMatchObject({ reason: "", resume_to: "" });
    expect(() => move(todo, "cancelled", facts())).toThrow(/reason/);
  });
});

describe("planning graph", () => {
  const metas = withBlocks([
    ticket("TICKET-001", { estimate: "L", priority: "low" }),
    ticket("TICKET-002", { blocked_by: ["TICKET-001"], estimate: "S" }),
    ticket("TICKET-003", { priority: "urgent", estimate: "S" }),
    ticket("TICKET-004", { blocked_by: ["TICKET-002", "TICKET-003"], estimate: "M" }),
    ticket("TICKET-005", { labels: ["human"], priority: "urgent" }),
  ]).map((t) => t.meta);

  it("computes the weighted critical path and detects cycles", () => {
    expect(criticalPath(metas)).toEqual({
      points: 7,
      path: ["TICKET-001", "TICKET-002", "TICKET-004"],
    });
    expect(criticalPath(metas, "TICKET-003")).toEqual({ points: 1, path: ["TICKET-003"] });
    expect(findCycle(metas)).toBeNull();
    expect(findCycle([{ ...metas[0]!, blocked_by: ["TICKET-002"] }, metas[1]!])).toEqual([
      "TICKET-001",
      "TICKET-002",
      "TICKET-001",
    ]);
  });

  it("picks by priority, skips human tickets unless asked, and simulates the next tickets", () => {
    expect(ready(metas).map((m) => m.id)).toEqual(["TICKET-003", "TICKET-001"]);
    expect(ready(metas, { onlyHuman: true }).map((m) => m.id)).toEqual(["TICKET-005"]);
    expect(upcoming(metas, 10).map((m) => m.id)).toEqual([
      "TICKET-003",
      "TICKET-005",
      "TICKET-001",
      "TICKET-002",
      "TICKET-004",
    ]);
  });
});

describe("commit and PR rules", () => {
  it("rejects AI attribution but allows human co-authors", () => {
    for (const bad of [
      "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>",
      "co-authored-by: Codex <noreply@openai.com>",
      "Co-authored-by: dependabot[bot] <bot@github.com>",
      "🤖 Generated with [Claude Code](https://claude.com/claude-code)",
      "Generated with Codex",
    ])
      expect(attributionProblems(`TICKET-001: add thing\n\n${bad}`)).not.toEqual([]);
    expect(
      attributionProblems("TICKET-001: add thing\n\nCo-authored-by: Divine <divine@example.com>"),
    ).toEqual([]);
    expect(cleanMessage("TICKET-001: x\n# Co-Authored-By: Claude")).toBe("TICKET-001: x");
  });

  it("requires the ticket id prefix on ticket branches only", () => {
    expect(ticketProblems("add thing", "divine/TICKET-014-rsvp")).not.toEqual([]);
    expect(ticketProblems("TICKET-013: add thing", "divine/TICKET-014-rsvp")).not.toEqual([]);
    expect(
      ticketProblems("TICKET-014: add RSVP form validation", "divine/TICKET-014-rsvp"),
    ).toEqual([]);
    expect(ticketProblems("Merge branch 'main'", "divine/TICKET-014-rsvp")).toEqual([]);
    expect(ticketProblems("chore: add ticket system", "chore/ticket-system")).toEqual([]);
  });
});

// ── CLI against real git repositories ────────────────────────────────────────

const cli = resolve("scripts/tickets.ts");
const tsx = resolve("node_modules/.bin/tsx");
const scratch: string[] = [];
afterEach(() => {
  for (const path of scratch.splice(0)) rmSync(path, { recursive: true, force: true });
});
function git(cwd: string, ...args: string[]) {
  return execFileSync("git", args, {
    cwd,
    env: isolatedGitEnv(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}
function clone(dir: string, remote: string, name: string, owner: string) {
  const path = join(dir, name);
  git(dir, "clone", "-q", "-b", "main", remote, path);
  git(path, "config", "user.email", "test@example.test");
  git(path, "config", "user.name", "Test");
  git(path, "config", "harness.owner", owner);
  return path;
}
function setup() {
  const dir = mkdtempSync(join(tmpdir(), "wedding-tickets-test-"));
  scratch.push(dir);
  const remote = join(dir, "origin.git");
  const seed = join(dir, "seed");
  git(dir, "init", "-q", "--bare", "-b", "main", remote);
  git(dir, "init", "-q", "-b", "main", seed);
  git(seed, "config", "user.email", "test@example.test");
  git(seed, "config", "user.name", "Test");
  mkdirSync(join(seed, "tickets"));
  writeFileSync(join(seed, "tickets/TEMPLATE.md"), readFileSync(resolve("tickets/TEMPLATE.md")));
  const fixtures = withBlocks([
    ticket("TICKET-001"),
    ticket("TICKET-002", { blocked_by: ["TICKET-001"] }),
  ]);
  for (const t of fixtures) writeFileSync(join(seed, t.path), serializeTicket(t));
  git(seed, "add", ".");
  git(seed, "commit", "-q", "-m", "chore: fixture");
  git(seed, "remote", "add", "origin", remote);
  git(seed, "push", "-q", "origin", "main");
  return {
    dir,
    remote,
    a: clone(dir, remote, "a", "divine"),
    b: clone(dir, remote, "b", "friend"),
  };
}
function t(cwd: string, ...args: string[]) {
  return new Promise<{ code: number | null; out: string }>((done) => {
    const child = spawn(tsx, [cli, ...args], {
      cwd,
      env: {
        ...isolatedGitEnv(),
        AGENT_OWNER: "",
        TICKETS_LEDGER: "origin",
        TICKETS_TODAY: "2026-10-22",
      },
    });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("close", (code) => done({ code, out }));
  });
}

describe("ticket CLI with a shared remote", () => {
  it("lets exactly one of two clones claim a ticket, without touching main checkouts", async () => {
    const { a, b, remote } = setup();
    writeFileSync(join(a, "notes.txt"), "uncommitted human work");
    const results = await Promise.all([
      t(a, "claim", "TICKET-001", "--agent", "claude"),
      t(b, "claim", "TICKET-001", "--agent", "codex"),
    ]);
    expect(results.filter((r) => r.code === 0)).toHaveLength(1);
    expect(results.find((r) => r.code !== 0)?.out).toMatch(/already claimed/);
    expect(readFileSync(join(a, "notes.txt"), "utf8")).toBe("uncommitted human work");
    expect(git(a, "status", "--porcelain")).toBe("?? notes.txt");
    const ledger = JSON.parse(git(remote, "show", "ticket-ledger:ledger.json"));
    const owner = ledger.tickets["WED-001"].owner as string;
    expect(["divine", "friend"]).toContain(owner);
    expect(ledger.tickets["TICKET-001"]).toBeUndefined();
    expect(ledger.tickets["WED-001"].branch).toBe("TICKET-001");
    expect((await t(a, "show", "WED-001", "--json")).out).toContain("TICKET-001");
    // The loser sees the live claim; blocked work cannot be claimed; only the owner may release.
    const loser = owner === "divine" ? b : a;
    expect((await t(loser, "next")).out).toMatch(/No ready ticket/);
    expect((await t(loser, "claim", "TICKET-002", "--agent", "codex")).out).toMatch(
      /blocked by TICKET-001/,
    );
    expect((await t(loser, "release", "TICKET-001")).code).not.toBe(0);
  }, 30000);

  it("writes the ticket file only on the ticket branch, and allocates fresh ids", async () => {
    const { a } = setup();
    expect((await t(a, "claim", "TICKET-001", "--agent", "claude")).code).toBe(0);
    git(a, "checkout", "-q", "-b", "divine/TICKET-001-build-thing-ticket-001");
    const started = await t(a, "move", "TICKET-001", "in_progress", "--agent", "claude");
    expect(started.code).toBe(0);
    const file = readFileSync(join(a, "tickets/TICKET-001-build-thing.md"), "utf8");
    expect(file).toMatch(/status: in_progress/);
    expect(file).toMatch(/- 2026-10-22 — todo → claimed — divine \(claude\)/);
    expect(file).toMatch(/- 2026-10-22 — todo → in_progress — divine \(claude\)/);
    expect(readFileSync(join(a, "tickets/BOARD.md"), "utf8")).toMatch(/### In progress \(1\)/);
    expect((await t(a, "move", "TICKET-001", "done")).out).toMatch(/not allowed/);
    const created = await t(
      a,
      "new",
      "--title",
      "Add a third thing",
      "--epic",
      "testing",
      "--module",
      "shared",
    );
    expect(created.out).toMatch(/TICKET-003-add-a-third-thing\.md/);
    // A new ticket starts with empty sections: validation must say so until it is filled in.
    expect((await t(a, "validate")).out).toMatch(/TICKET-003/);
  }, 30000);
});
