import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { isolatedGitEnv } from "./git-env";
import { attributionProblems, cleanMessage, ticketProblems } from "../harness/commit-rules.mjs";
import { criteria, parseTicket, serializeTicket } from "../tickets/format";
import { criticalPath, findCycle, ready, upcoming } from "../tickets/graph";
import { SECTIONS } from "../tickets/model";
import { REVIEW_SECTIONS } from "../tickets/review";
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

  it("finds duplicates, gaps, dangling deps, derived reverse dependencies and cycles", () => {
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
    expect(
      withBlocks([ticket("TICKET-001"), ticket("TICKET-002", { blocked_by: ["TICKET-001"] })])[0]
        ?.meta.blocks,
    ).toEqual(["TICKET-002"]);
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
  return tWithEnv(cwd, {}, ...args);
}
function tWithEnv(cwd: string, extraEnv: Record<string, string>, ...args: string[]) {
  return new Promise<{ code: number | null; out: string }>((done) => {
    const child = spawn(tsx, [cli, ...args], {
      cwd,
      env: {
        ...isolatedGitEnv(),
        AGENT_OWNER: "",
        TICKETS_LEDGER: "origin",
        TICKETS_TODAY: "2026-10-22",
        ...extraEnv,
      },
    });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("close", (code) => done({ code, out }));
  });
}

describe("ticket CLI with a shared remote", () => {
  it.each([
    "failed",
    "passed",
    "forged marker",
    "changed head",
    "full failed",
    "full passed",
    "full changed head",
    "pr failed",
    "pr passed",
    "pr changed head",
    "pr full failed",
    "pr full passed",
    "pr full changed head",
    "pr force failed",
  ])(
    "review transition requires current successful verification: %s",
    async (scenario) => {
      const { a, dir, remote } = setup();
      git(a, "checkout", "-qb", "TICKET-001");
      const active = ticket(
        "TICKET-001",
        {
          status: "in_progress",
          owner: "divine",
          agent: "codex",
          branch: "TICKET-001",
          started: "2026-10-22",
          blocks: ["TICKET-002"],
        },
        true,
      );
      writeFileSync(join(a, active.path), serializeTicket(active));
      mkdirSync(join(a, "docs/plans"), { recursive: true });
      writeFileSync(
        join(a, "docs/plans/TICKET-001-pr.md"),
        REVIEW_SECTIONS.map((name) => `# ${name}\nTask-specific evidence for this fixture.\n`).join(
          "\n",
        ),
      );
      git(a, "add", ".");
      git(a, "commit", "-qm", "TICKET-001: prepare review fixture");
      git(a, "push", "-qu", "origin", "HEAD");
      const before = readFileSync(join(a, active.path), "utf8");
      const head = git(a, "rev-parse", "HEAD");
      const bin = join(dir, "review-bin");
      const calls = join(dir, "verification-calls.json");
      mkdirSync(bin);
      writeFileSync(
        join(bin, "gh"),
        `#!${process.execPath}\nconsole.log(JSON.stringify({url:"https://example.test/pr/1",state:"OPEN",baseRefName:"develop"}));\n`,
        { mode: 0o755 },
      );
      writeFileSync(
        join(bin, "pnpm"),
        `#!${process.execPath}
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
fs.appendFileSync(process.env.REVIEW_CALLS, JSON.stringify(process.argv.slice(2)) + "\\n");
if (process.env.REVIEW_SCENARIO.endsWith("changed head")) {
  execFileSync("git", ["commit", "--allow-empty", "-qm", "TICKET-001: changed while checking"]);
  execFileSync("git", ["push", "-q", "origin", "HEAD"]);
}
process.exit(process.env.REVIEW_SCENARIO.endsWith("failed") || process.env.REVIEW_SCENARIO === "forged marker" ? 1 : 0);
`,
        { mode: 0o755 },
      );
      const result = await tWithEnv(
        a,
        {
          PATH: `${bin}:${process.env.PATH ?? ""}`,
          REVIEW_CALLS: calls,
          REVIEW_SCENARIO: scenario,
          TICKETS_VERIFIED_SHA: scenario === "forged marker" ? head : "",
        },
        scenario.startsWith("pr ") ? "pr" : "move",
        "TICKET-001",
        "in_review",
        ...(scenario.includes("full") ? ["--full"] : []),
        ...(scenario.includes("force") ? ["--force-verify"] : []),
      );
      expect(existsSync(calls), result.out).toBe(true);
      expect(
        readFileSync(calls, "utf8")
          .trim()
          .split("\n")
          .map((line) => JSON.parse(line)),
      ).toEqual([
        [scenario.includes("full") || scenario.includes("force") ? "verify" : "verify:quick"],
      ]);
      if (scenario.endsWith("passed")) {
        expect(result.code, result.out).toBe(0);
        const ledger = JSON.parse(git(remote, "show", "ticket-ledger:ledger.json"));
        expect(ledger.tickets["WED-001"].status).toBe("in_review");
      } else {
        expect(result.code, result.out).not.toBe(0);
        expect(result.out).toMatch(/pnpm verify/);
        expect(readFileSync(join(a, active.path), "utf8")).toBe(before);
        expect(
          git(remote, "for-each-ref", "--format=%(objectname)", "refs/heads/ticket-ledger"),
        ).toBe("");
      }
    },
    30000,
  );

  it("new worktree bases use remote develop instead of the current feature HEAD", () => {
    const { a } = setup();
    git(a, "push", "origin", "main:develop");
    const base = git(a, "rev-parse", "HEAD");
    git(a, "checkout", "-qb", "feature-unmerged");
    writeFileSync(join(a, "unrelated.txt"), "Do not inherit me");
    git(a, "add", ".");
    git(a, "commit", "-qm", "chore: unrelated feature");
    const helper = resolve("scripts/harness/worktree-base.mjs");
    const result = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `import { worktreeBase } from ${JSON.stringify("file://" + helper)}; console.log(JSON.stringify(worktreeBase(process.cwd(), "TICKET-003")))`,
      ],
      { cwd: a, env: isolatedGitEnv(), encoding: "utf8" },
    );
    expect(JSON.parse(result)).toEqual({ existingBranch: false, baseCommit: base });
  });

  it("dashboard overlays the live ledger and cannot inject ticket HTML", async () => {
    const { a, b } = setup();
    expect((await t(b, "claim", "TICKET-001", "--agent", "codex")).code).toBe(0);
    const sample = ticket("TICKET-001", { title: "Test </script><img src=x onerror=alert(1)>" });
    writeFileSync(join(a, sample.path), serializeTicket(sample));
    const before = git(a, "diff", "HEAD");
    const generated = await t(a, "dashboard");
    expect(generated.code, generated.out).toBe(0);
    const html = readFileSync(join(a, "artifacts/tickets/index.html"), "utf8");
    expect(html).toContain('"owner":"friend"');
    expect(html).not.toContain(sample.meta.title);
    expect(html).toContain("Ledger snapshot");
    expect(git(a, "diff", "HEAD")).toBe(before);
    git(a, "remote", "set-url", "origin", join(a, "missing.git"));
    expect((await t(a, "dashboard")).out).toContain("OFFLINE");
    expect(readFileSync(join(a, "artifacts/tickets/index.html"), "utf8")).toContain(
      "status may be stale",
    );
  }, 30000);

  it("does not sync or write another branch's ticket", async () => {
    const { a, b } = setup();
    expect((await t(b, "claim", "TICKET-001", "--agent", "codex")).code).toBe(0);
    git(a, "checkout", "-qb", "TICKET-002");
    const before = git(a, "diff", "HEAD", "--", "tickets");
    expect((await t(a, "sync", "TICKET-001")).code).not.toBe(0);
    expect((await t(a, "board")).code).toBe(0);
    expect((await t(a, "next")).code).toBe(0);
    expect(git(a, "diff", "HEAD", "--", "tickets")).toBe(before);
  }, 30000);

  it("renders snapshots without rewriting tracked boards or other ticket definitions", async () => {
    const { a } = setup();
    writeFileSync(join(a, "tickets/BOARD.md"), "# Stable dashboard entry point\n");
    git(a, "add", ".");
    git(a, "commit", "-qm", "chore: stable entry point");
    const before = readFileSync(join(a, "tickets/BOARD.md"), "utf8");
    expect((await t(a, "render")).code).toBe(0);
    expect(readFileSync(join(a, "tickets/BOARD.md"), "utf8")).toBe(before);
    expect(git(a, "diff", "HEAD", "--", "tickets")).toBe("");
    expect(readFileSync(join(a, "artifacts/tickets/BOARD.md"), "utf8")).toContain("TICKET-001");
  }, 30000);

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

  it.each([
    ["--estimate", "XS", ["S", "M", "L"]],
    ["--priority", "critical", ["urgent", "high", "medium", "low"]],
    ["--status", "finished", ["backlog", "todo"]],
  ])(
    "rejects invalid %s before allocating an ID",
    async (flag, value, allowed) => {
      const { a, remote } = setup();
      expect((await t(a, "claim", "TICKET-001", "--agent", "codex")).code).toBe(0);
      const before = git(remote, "rev-parse", "refs/heads/ticket-ledger");
      const beforeData = JSON.parse(git(remote, "show", "refs/heads/ticket-ledger:ledger.json"));
      const args = [
        "new",
        "--title",
        "Add a third thing",
        "--epic",
        "testing",
        "--module",
        "shared",
      ];
      const rejected = await t(a, ...args, flag, value);
      expect(rejected.code).not.toBe(0);
      for (const option of allowed) expect(rejected.out).toContain(option);
      expect(git(remote, "rev-parse", "refs/heads/ticket-ledger")).toBe(before);
      expect(JSON.parse(git(remote, "show", "refs/heads/ticket-ledger:ledger.json")).lastId).toBe(
        beforeData.lastId,
      );
      const valid = await t(a, ...args);
      expect(valid.code, valid.out).toBe(0);
      expect(valid.out).toContain("TICKET-003-add-a-third-thing.md");
      expect(JSON.parse(git(remote, "show", "refs/heads/ticket-ledger:ledger.json")).lastId).toBe(
        3,
      );
    },
    30000,
  );

  it("does not allocate an ID when the required owner is missing", async () => {
    const { a, remote } = setup();
    expect((await t(a, "claim", "TICKET-001", "--agent", "codex")).code).toBe(0);
    const before = git(remote, "rev-parse", "refs/heads/ticket-ledger");
    git(a, "config", "harness.owner", "");
    const rejected = await t(
      a,
      "new",
      "--title",
      "Add a third thing",
      "--epic",
      "testing",
      "--module",
      "shared",
    );
    expect(rejected.code).not.toBe(0);
    expect(rejected.out).toMatch(/owner/);
    expect(git(remote, "rev-parse", "refs/heads/ticket-ledger")).toBe(before);
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
    expect(readFileSync(join(a, "tickets/TICKET-002-build-thing.md"), "utf8")).toMatch(
      /status: todo/,
    );
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

describe("working ahead (TICKET-214)", () => {
  const todo = ticket("TICKET-005", { blocked_by: ["TICKET-001", "TICKET-002"] }).meta;
  type Status = ReturnType<MoveFacts["statusOf"]>;
  const status = (map: Record<string, Status>) => (id: string) => map[id];

  it("allows an id gap only when the ledger reserved it", () => {
    const tickets = [ticket("TICKET-001"), ticket("TICKET-004")];
    expect(validateTickets(tickets).join("\n")).toMatch(/missing TICKET-002, TICKET-003/);
    const reserved = validateTickets(tickets, { reserved: new Set(["TICKET-002"]) }).join("\n");
    expect(reserved).toMatch(/missing TICKET-003/);
    expect(reserved).not.toMatch(/TICKET-002/);
  });

  it("refuses unfinished blockers by default and points to --ahead", () => {
    const inReview = facts({
      statusOf: status({ "TICKET-001": "in_review", "TICKET-002": "done" }),
    });
    expect(() => claim(todo, inReview, "TICKET-005")).toThrow(/blocked by TICKET-001.*--ahead/);
  });

  it("claims ahead of blockers that are in progress, in review or blocked", () => {
    const busy = facts({
      ahead: true,
      statusOf: status({ "TICKET-001": "in_review", "TICKET-002": "in_progress" }),
    });
    expect(claim(todo, busy, "TICKET-005")).toMatchObject({ owner: "divine" });
    const stuck = facts({
      ahead: true,
      statusOf: status({ "TICKET-001": "blocked", "TICKET-002": "done" }),
    });
    expect(claim(todo, stuck, "TICKET-005")).toMatchObject({ owner: "divine" });
  });

  it("never starts ahead of a blocker nobody has started", () => {
    const idle = facts({
      ahead: true,
      statusOf: status({ "TICKET-001": "todo", "TICKET-002": "in_review" }),
    });
    expect(() => claim(todo, idle, "TICKET-005")).toThrow(/TICKET-001 has not started/);
  });

  it("moves to in progress ahead with the same rule", () => {
    const claimed = { ...todo, owner: "divine", agent: "claude", branch: "TICKET-005" };
    const busy = {
      statusOf: status({ "TICKET-001": "in_review", "TICKET-002": "done" }),
      branch: "TICKET-005",
    };
    expect(() => move(claimed, "in_progress", facts(busy))).toThrow(/--ahead/);
    expect(move(claimed, "in_progress", facts({ ...busy, ahead: true }))).toMatchObject({
      status: "in_progress",
    });
  });

  it("still refuses done until every blocker is done", () => {
    const review = { ...todo, status: "in_review" as const, owner: "divine", branch: "TICKET-005" };
    const merged = { criteriaTicked: true, mergedPr: "https://x.test/1", ahead: true };
    const pending = status({ "TICKET-001": "in_review", "TICKET-002": "done" });
    expect(() => move(review, "done", facts({ ...merged, statusOf: pending }))).toThrow(
      /cannot be done before TICKET-001/,
    );
    expect(move(review, "done", facts(merged))).toMatchObject({ status: "done" });
  });
});

describe("explicit merged-ticket repair reconciliation", () => {
  it.each([
    "passed",
    "in-progress passed",
    "open original",
    "open repair",
    "wrong base",
    "unreachable",
    "repair omits original",
    "failed CI",
    "pending CI",
    "missing CI",
    "optional only",
    "stale CI head",
    "changed repair head",
    "newer CI run",
    "same run restarted",
    "different repository",
    "unchecked criteria",
    "other owner",
    "unfinished blocker",
    "fetch failure",
  ])(
    "preserves the ledger unless complete immutable evidence passes: %s",
    async (scenario) => {
      const { a, dir, remote } = setup();
      git(a, "checkout", "-qb", "develop");
      const active = ticket(
        "TICKET-001",
        {
          status: scenario === "in-progress passed" ? "in_progress" : "blocked",
          owner: scenario === "other owner" ? "friend" : "divine",
          agent: "codex",
          branch: "TICKET-001",
          pr: "https://github.com/example/repo/pull/1",
          reason: "Original CI failed before external merge",
          resume_to: "in_progress",
          blocked_by: scenario === "unfinished blocker" ? ["TICKET-002"] : [],
        },
        scenario !== "unchecked criteria",
      );
      writeFileSync(join(a, active.path), serializeTicket(active));
      git(a, "add", ".");
      git(a, "commit", "-qm", "original merged work");
      const original = git(a, "rev-parse", "HEAD");
      git(a, "commit", "--allow-empty", "-qm", "repair tested head");
      const head = git(a, "rev-parse", "HEAD");
      git(a, "commit", "--allow-empty", "-qm", "repair merge");
      const merge = git(a, "rev-parse", "HEAD");
      git(a, "push", "-q", "origin", "develop");
      const bin = join(dir, "reconcile-bin");
      mkdirSync(bin);
      const fixture = join(dir, "proof.json");
      const jobNames = [
        "tickets valid",
        "no AI attribution in PR text",
        "pnpm verify",
        "migrations + seed",
        "invitation journey (mobile + desktop)",
      ];
      writeFileSync(fixture, JSON.stringify({ scenario, original, head, merge, jobNames }));
      writeFileSync(
        join(bin, "gh"),
        `#!${process.execPath}
const fs = require("node:fs");
const f = JSON.parse(fs.readFileSync(process.env.RECONCILE_FIXTURE, "utf8"));
const args = process.argv.slice(2); const s = f.scenario; let result;
if (args[0] === "pr") {
  const original = args[2].endsWith("/1");
  const countFile = process.env.RECONCILE_FIXTURE + ".reads";
  const reads = fs.existsSync(countFile) ? Number(fs.readFileSync(countFile, "utf8")) : 0;
  if (!original) fs.writeFileSync(countFile, String(reads + 1));
  result = {url: (original && s === "different repository" ? "https://github.com/other/repo/pull/" : "https://github.com/example/repo/pull/") + (original ? "1" : "2"), state: s === (original ? "open original" : "open repair") ? "OPEN" : "MERGED", baseRefName: s === "wrong base" ? "main" : "develop", headRefOid: !original && s === "changed repair head" && reads > 0 ? f.merge : f.head, mergeCommit: {oid: original ? (s === "repair omits original" ? f.merge : f.original) : (s === "unreachable" ? "f".repeat(40) : f.merge)}};
} else if(args[1] === "list") {
  const listFile = process.env.RECONCILE_FIXTURE + ".lists";
  const lists = fs.existsSync(listFile) ? Number(fs.readFileSync(listFile, "utf8")) : 0;
  fs.writeFileSync(listFile, String(lists + 1));
  result = s === "missing CI" ? [] : [{databaseId: s === "newer CI run" && lists > 0 ? 43 : 42}];
}
else {
const viewFile = process.env.RECONCILE_FIXTURE + ".views";
const views = fs.existsSync(viewFile) ? Number(fs.readFileSync(viewFile, "utf8")) : 0;
fs.writeFileSync(viewFile, String(views + 1));
result = {databaseId: 42, headSha: s === "stale CI head" ? f.original : f.head, status: (s === "pending CI" || (s === "same run restarted" && views > 0)) ? "in_progress" : "completed", conclusion: s === "failed CI" ? "failure" : "success", event: "pull_request", url: "https://github.com/example/repo/actions/runs/42", jobs: (s === "optional only" ? ["review"] : f.jobNames).map(name=>({name,status:"completed",conclusion:"success"}))};
}
console.log(JSON.stringify(result));
`,
        { mode: 0o755 },
      );
      if (scenario === "fetch failure") git(remote, "update-ref", "-d", "refs/heads/develop");
      const before = readFileSync(join(a, active.path), "utf8");
      const result = await tWithEnv(
        a,
        { PATH: `${bin}:${process.env.PATH ?? ""}`, RECONCILE_FIXTURE: fixture },
        "reconcile",
        "TICKET-001",
        "--repair-pr",
        "2",
        "--reason",
        "Original parity failed; merged repair now passes all required CI",
      );
      expect(readFileSync(join(a, active.path), "utf8")).toBe(before);
      if (scenario.endsWith("passed")) {
        expect(result.code, result.out).toBe(0);
        const ledger = JSON.parse(git(remote, "show", "ticket-ledger:ledger.json"));
        expect(ledger.tickets["WED-001"].status).toBe("done");
        expect(ledger.tickets["WED-001"].log.join("\n")).toContain(head);
        expect(ledger.tickets["WED-001"].log.join("\n")).toContain(
          "Original CI failed before external merge",
        );
        expect(ledger.tickets["WED-001"].pr).toBe(active.meta.pr);
      } else {
        expect(result.code, result.out).not.toBe(0);
        expect(
          git(remote, "for-each-ref", "--format=%(objectname)", "refs/heads/ticket-ledger"),
        ).toBe("");
      }
    },
    30000,
  );
});
