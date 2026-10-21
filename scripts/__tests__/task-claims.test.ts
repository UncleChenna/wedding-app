import { afterEach, describe, expect, it } from "vitest";
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const scratch: string[] = [];
const script = resolve("scripts/task.mjs");
function git(cwd: string, ...args: string[]) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}
function setup() {
  const dir = mkdtempSync(join(tmpdir(), "wedding-claims-test-"));
  scratch.push(dir);
  const remote = join(dir, "origin.git");
  const a = join(dir, "a");
  const b = join(dir, "b");
  git(dir, "init", "--bare", remote);
  git(dir, "init", "-b", "main", a);
  git(a, "config", "user.email", "test@example.test");
  git(a, "config", "user.name", "Test");
  git(a, "config", "harness.owner", "divine");
  mkdirSync(join(a, "docs"));
  writeFileSync(
    join(a, "docs/tasks.json"),
    JSON.stringify({
      tasks: [
        {
          id: "T-1",
          title: "Test task",
          module: "shared",
          acceptance: ["works"],
          status: "todo",
          owner: null,
          branch: null,
          claimed_at: null,
          dependsOn: [],
        },
      ],
    }),
  );
  git(a, "add", "docs/tasks.json");
  git(a, "commit", "-m", "chore: fixture");
  git(a, "remote", "add", "origin", remote);
  git(a, "push", "origin", "main");
  git(dir, "clone", "-b", "main", remote, b);
  git(b, "config", "user.email", "test@example.test");
  git(b, "config", "user.name", "Test");
  git(b, "config", "harness.owner", "friend");
  return { dir, remote, a, b };
}
function claim(cwd: string, action = "claim") {
  return new Promise<{ code: number | null; error: string }>((resolve) => {
    const child = spawn(process.execPath, [script, action, "T-1"], {
      cwd,
      env: { ...process.env, AGENT_OWNER: "" },
    });
    let error = "";
    child.stderr.on("data", (d) => {
      error += d;
    });
    child.on("close", (code) => resolve({ code, error }));
  });
}
afterEach(() => {
  for (const path of scratch.splice(0)) rmSync(path, { recursive: true, force: true });
});
describe("shared remote task claims", () => {
  it("allows exactly one claim across two independent clones and leaves unrelated changes alone", async () => {
    const { a, b, remote } = setup();
    writeFileSync(join(a, "notes.txt"), "uncommitted human work");
    const before = readFileSync(join(a, "docs/tasks.json"), "utf8");
    const results = await Promise.all([claim(a), claim(b)]);
    expect(results.filter((r) => r.code === 0)).toHaveLength(1);
    expect(results.filter((r) => r.code !== 0)).toHaveLength(1);
    expect(readFileSync(join(a, "notes.txt"), "utf8")).toBe("uncommitted human work");
    expect(readFileSync(join(a, "docs/tasks.json"), "utf8")).toBe(before);
    const ledger = JSON.parse(git(remote, "show", "agent-tasks:docs/tasks.json"));
    expect(ledger.tasks[0].status).toBe("claimed");
    const winner = ledger.tasks[0].owner === "divine" ? a : b;
    const loser = winner === a ? b : a;
    // A stale/local snapshot cannot override the authoritative live claim.
    const stale = JSON.parse(readFileSync(join(winner, "docs/tasks.json"), "utf8"));
    stale.tasks[0].status = "done";
    writeFileSync(join(winner, "docs/tasks.json"), JSON.stringify(stale));
    expect((await claim(winner)).code).not.toBe(0);
    expect((await claim(loser, "release")).code).not.toBe(0);
    expect((await claim(winner, "release")).code).toBe(0);
    expect((await claim(loser)).code).toBe(0);
  }, 15000);
});
