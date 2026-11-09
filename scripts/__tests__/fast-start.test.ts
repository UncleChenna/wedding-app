import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { startCommands, startPlan } from "../tickets/start";
import { startableAhead } from "../tickets/graph";
import { needsStart } from "../db-ensure.mjs";
import { staleHarnessCommits, staleHarnessMessage } from "../harness/stale-harness.mjs";
import { isolatedGitEnv } from "./git-env";

describe("t:start plan", () => {
  it("goes all the way from backlog, skips the claim for your own ticket, and resumes", () => {
    expect(startPlan({ status: "backlog", owner: "" }, "ada")).toEqual([
      "todo",
      "claim",
      "worktree",
      "in_progress",
    ]);
    expect(startPlan({ status: "todo", owner: "" }, "ada")).toEqual([
      "claim",
      "worktree",
      "in_progress",
    ]);
    expect(startPlan({ status: "todo", owner: "ada" }, "ada")).toEqual(["worktree", "in_progress"]);
    expect(startPlan({ status: "in_progress", owner: "ada" }, "ada")).toEqual(["worktree"]);
  });
  it("refuses someone else's ticket and finished work", () => {
    expect(() => startPlan({ status: "todo", owner: "bo" }, "ada")).toThrow(/Owned by bo/);
    expect(() => startPlan({ status: "done", owner: "" }, "ada")).toThrow(/It is done/);
    expect(() => startPlan({ status: "in_review", owner: "ada" }, "ada")).toThrow();
  });
  it("starts the database only with --db and moves to in_progress from the new worktree", () => {
    const lazy = startCommands({ id: "TICKET-001", owner: "ada", agent: "claude" });
    expect(lazy.worktree.args).toEqual(["wt:new", "TICKET-001"]);
    expect(lazy.claim.args).toEqual([
      "t:claim",
      "TICKET-001",
      "--owner",
      "ada",
      "--agent",
      "claude",
    ]);
    expect(lazy.in_progress).toEqual({
      args: ["t:move", "TICKET-001", "in_progress", "--push"],
      inWorktree: true,
    });
    const eager = startCommands({ id: "TICKET-001", owner: "ada", db: true, ahead: true });
    expect(eager.worktree.args).toEqual(["wt:new", "TICKET-001", "--db"]);
    expect(eager.claim.args).toContain("--ahead");
    expect(eager.in_progress.args).toContain("--ahead");
  });
});

describe("t:next ahead list", () => {
  const meta = (id: string, status: string, blocked_by: string[] = [], owner = "") => ({
    id,
    status,
    owner,
    blocked_by,
    priority: "high",
    labels: [],
  });
  it("offers todo tickets whose blockers are being worked on, not ready or unstarted ones", () => {
    const metas = [
      meta("TICKET-001", "in_review"),
      meta("TICKET-002", "in_progress"),
      meta("TICKET-003", "todo"),
      meta("TICKET-004", "done"),
      meta("TICKET-010", "todo", ["TICKET-001"]),
      meta("TICKET-011", "todo", ["TICKET-002", "TICKET-004"]),
      meta("TICKET-012", "todo", ["TICKET-003"]),
      meta("TICKET-013", "todo", ["TICKET-004"]),
      meta("TICKET-014", "todo", ["TICKET-001"], "bo"),
    ] as unknown as Parameters<typeof startableAhead>[0];
    expect(startableAhead(metas).map((m) => m.id)).toEqual(["TICKET-010", "TICKET-011"]);
  });
});

describe("on-demand database", () => {
  it("starts only a managed worktree's stopped stack", () => {
    expect(needsStart({ managed: true, running: false })).toBe(true);
    expect(needsStart({ managed: true, running: true })).toBe(false);
    expect(needsStart({ managed: false, running: false })).toBe(false);
  });
});

describe("stale harness warning", () => {
  it("counts origin/develop commits that change the harness but aren't checked out", () => {
    const dir = mkdtempSync(join(tmpdir(), "wedding-stale-harness-"));
    // Inside a git hook GIT_DIR/GIT_INDEX_FILE point at the real repo; the function under test
    // uses process.env, so clear them for the throwaway repo (restored in finally).
    const saved = Object.fromEntries(
      Object.entries(process.env).filter(([key]) => key.startsWith("GIT_")),
    );
    for (const key of Object.keys(saved)) delete process.env[key];
    const git = (...args: string[]) =>
      spawnSync("git", ["-c", "user.email=t@example.test", "-c", "user.name=T", ...args], {
        cwd: dir,
        encoding: "utf8",
        env: isolatedGitEnv(),
      }).stdout.trim();
    try {
      mkdirSync(join(dir, "scripts/harness"), { recursive: true });
      writeFileSync(join(dir, "scripts/harness/x.mjs"), "1\n");
      writeFileSync(join(dir, "README.md"), "a\n");
      git("init", "-q", "-b", "old-branch");
      git("add", ".");
      git("commit", "-qm", "init");
      const old = git("rev-parse", "HEAD");
      writeFileSync(join(dir, "README.md"), "b\n");
      git("commit", "-qam", "docs only");
      git("update-ref", "refs/remotes/origin/develop", "HEAD");
      git("reset", "-q", "--hard", old);
      expect(staleHarnessCommits(dir)).toEqual([]);

      git("checkout", "-q", "refs/remotes/origin/develop");
      writeFileSync(join(dir, "scripts/harness/x.mjs"), "2\n");
      git("commit", "-qam", "harness fix");
      git("update-ref", "refs/remotes/origin/develop", "HEAD");
      git("checkout", "-q", "old-branch");
      const behind = staleHarnessCommits(dir);
      expect(behind).toHaveLength(1);
      expect(behind[0]).toContain("harness fix");
      expect(staleHarnessMessage(behind)).toContain("1 commit(s) behind origin/develop");
      expect(staleHarnessMessage([])).toBeNull();
    } finally {
      Object.assign(process.env, saved);
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
