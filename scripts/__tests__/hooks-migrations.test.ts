import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { destructiveSql, journalOnlyAppends } from "../harness/core.mjs";
import { isolatedGitEnv } from "./git-env";

const hook = resolve("scripts/harness/hooks.mjs");
const journal = (tags: string[]) =>
  JSON.stringify({
    version: "7",
    dialect: "postgresql",
    entries: tags.map((tag, idx) => ({ idx, tag, when: idx, breakpoints: true })),
  });

describe("destructiveSql", () => {
  it.each([
    ['DROP TABLE "guests";', true],
    ['ALTER TABLE "a" DROP COLUMN "b";', true],
    ['ALTER TABLE "a" ALTER COLUMN "b" SET DATA TYPE integer;', true],
    ['ALTER TABLE "a" ALTER COLUMN "b" TYPE text;', true],
    ["TRUNCATE orders;", true],
    ["DELETE FROM orders WHERE true;", true],
    ['ALTER TABLE "a" RENAME TO "b";', true],
    ['CREATE TABLE "order_alerts" ("id" uuid PRIMARY KEY);', false],
    ['ALTER TABLE "a" ADD COLUMN "c" text;', false],
    ['DROP INDEX "a_idx";', false],
    ['ALTER TABLE "a" DROP CONSTRAINT "a_fk";', false],
    ["-- DROP TABLE guests\nCREATE INDEX x ON a (b);", false],
  ])("%s → %s", (sql, expected) => {
    expect(destructiveSql(sql)).toBe(expected);
  });
});

describe("journalOnlyAppends", () => {
  it("accepts appended entries and refuses edited or removed ones", () => {
    expect(journalOnlyAppends(journal(["0000_a"]), journal(["0000_a", "0001_b"]))).toBe(true);
    expect(journalOnlyAppends(null, journal(["0000_a"]))).toBe(true);
    expect(journalOnlyAppends(journal(["0000_a", "0001_b"]), journal(["0000_a"]))).toBe(false);
    expect(journalOnlyAppends(journal(["0000_a"]), journal(["0000_z", "0001_b"]))).toBe(false);
  });
});

describe("hooks in a throwaway repository", () => {
  let dir: string;
  let repo: string;
  let env: NodeJS.ProcessEnv;
  const git = (...args: string[]) =>
    spawnSync("git", ["-c", "user.email=t@example.test", "-c", "user.name=T", ...args], {
      cwd: repo,
      encoding: "utf8",
      env: isolatedGitEnv(),
    });
  const run = (mode: string, input = "") =>
    spawnSync(process.execPath, [hook, mode, "claude"], {
      input: input || JSON.stringify({ cwd: repo }),
      cwd: repo,
      encoding: "utf8",
      env,
    });

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "wedding-hook-migrations-"));
    repo = join(dir, "repo");
    mkdirSync(join(repo, "drizzle/meta"), { recursive: true });
    writeFileSync(join(repo, "drizzle/0000_init.sql"), 'CREATE TABLE "a" ("id" int);\n');
    writeFileSync(join(repo, "drizzle/meta/_journal.json"), journal(["0000_init"]));
    writeFileSync(join(repo, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
    git("init", "-q", "-b", "TICKET-999");
    git("add", ".");
    git("commit", "-qm", "chore: init");
    // Fake pnpm: lint-staged and verify:quick pass, so only the protection rules decide.
    const fake = join(dir, "pnpm");
    writeFileSync(fake, "#!/bin/sh\nexit 0\n");
    chmodSync(fake, 0o755);
    env = isolatedGitEnv({ PATH: `${dir}:${process.env.PATH}` });
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("commits newly generated additive migration files without an approval file", () => {
    writeFileSync(join(repo, "drizzle/0001_alerts.sql"), 'CREATE TABLE "b" ("id" int);\n');
    writeFileSync(join(repo, "drizzle/meta/0001_snapshot.json"), "{}\n");
    writeFileSync(join(repo, "drizzle/meta/_journal.json"), journal(["0000_init", "0001_alerts"]));
    git("add", ".");
    const result = run("commit");
    expect(result.status, result.stderr).toBe(0);
  });

  it("refuses an edit to an already-committed migration at commit", () => {
    writeFileSync(join(repo, "drizzle/0000_init.sql"), 'CREATE TABLE "a" ("id" bigint);\n');
    git("add", ".");
    const result = run("commit");
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("Protected file drizzle/0000_init.sql");
  });

  it("refuses a rewritten journal at commit", () => {
    writeFileSync(join(repo, "drizzle/meta/_journal.json"), journal(["0000_renamed"]));
    git("add", ".");
    expect(run("commit").status).toBe(2);
  });

  it("asks the owner before committing a destructive generated migration", () => {
    writeFileSync(join(repo, "drizzle/0001_drop.sql"), 'DROP TABLE "a";\n');
    git("add", ".");
    const result = run("commit");
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("Ask the owner first");
  });

  it("reports a protected change at stop without failing, but still refuses it at commit", () => {
    writeFileSync(join(repo, "pnpm-lock.yaml"), "lockfileVersion: '9.1'\n");
    const stop = run("stop");
    expect(stop.status, stop.stderr).toBe(0);
    expect(stop.stderr).toContain("Note: Protected file pnpm-lock.yaml");
    git("add", ".");
    expect(run("commit").status).toBe(2);
  });

  it("reports a protected change after a tool call without failing it", () => {
    writeFileSync(join(repo, "pnpm-lock.yaml"), "lockfileVersion: '9.1'\n");
    const post = run(
      "post",
      JSON.stringify({ cwd: repo, tool_name: "Bash", tool_input: { command: "pnpm install" } }),
    );
    expect(post.status, post.stderr).toBe(0);
    expect(post.stderr).toContain("Note: Protected file pnpm-lock.yaml");
  });
});
