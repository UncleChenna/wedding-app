import { afterEach, expect, it } from "vitest";
import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { delimiter, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { hookRepo } from "./hook-repo";

const hook = resolve("scripts/harness/hooks.mjs");
const textRules = resolve("scripts/harness/commit-rules.mjs");
const fixtures: ReturnType<typeof hookRepo>[] = [];
afterEach(() => {
  for (const f of fixtures.splice(0)) f.cleanup();
});
function fixture(branch = "TICKET-999", legacy = false) {
  const f = hookRepo(branch);
  fixtures.push(f);
  const bin = join(f.path, "bin");
  mkdirSync(bin);
  const called = join(f.path, "pnpm-called");
  writeFileSync(join(bin, "pnpm"), "#!/bin/sh\nprintf called >> '" + called + "'\nexit 0\n");
  chmodSync(join(bin, "pnpm"), 0o755);
  if (legacy) {
    const executable =
      process.env.LEGACY_GIT_BIN ??
      (process.env.PATH ?? "")
        .split(delimiter)
        .map((part) => join(part, "git"))
        .find((path) => existsSync(path));
    if (!executable) throw new Error("Git fixture executable unavailable");
    writeFileSync(
      join(bin, "git"),
      "#!" +
        process.execPath +
        "\n" +
        "const {spawnSync}=require('node:child_process');\n" +
        "const args=process.argv.slice(2);\n" +
        "if(args[0]==='branch' && args[1]==='--show-current') process.exit(129);\n" +
        "const child=spawnSync(" +
        JSON.stringify(executable) +
        ",args,{stdio:'inherit'});process.exit(child.status??1);\n",
    );
    chmodSync(join(bin, "git"), 0o755);
  }
  return { ...f, called, env: { ...f.env, PATH: bin + delimiter + process.env.PATH } };
}
function run(f: ReturnType<typeof fixture>, mode: string, input = {}) {
  return spawnSync(process.execPath, [hook, mode, "codex"], {
    cwd: f.path,
    env: f.env,
    encoding: "utf8",
    input: JSON.stringify({ cwd: f.path, ...input }),
  });
}
it.each(["pre", "post", "stop", "commit"])(
  "%s rejects an unapproved protected change before verification",
  (mode) => {
    const f = fixture();
    mkdirSync(join(f.path, "drizzle"));
    writeFileSync(join(f.path, "drizzle/new.sql"), "select 1;\n");
    if (mode === "commit") f.git("add", "drizzle/new.sql");
    const result = run(f, mode, {
      tool_name: "Write",
      tool_input: { file_path: "drizzle/new.sql" },
    });
    expect(result.status, result.stderr).toBe(2);
    expect(result.stderr).toContain("Protected file drizzle/new.sql");
    expect(existsSync(f.called)).toBe(false);
  },
);
it.each(["main", "develop", "TICKET-999"])(
  "the branch guard handles %s without newer Git flags",
  (branch) => {
    const f = fixture(branch, true);
    const result = run(f, "pre", {
      tool_name: "Bash",
      tool_input: { command: ["git", "commit -m example"].join(" ") },
    });
    expect(result.status, result.stderr).toBe(branch === "TICKET-999" ? 0 : 2);
    if (branch !== "TICKET-999") expect(result.stderr).toContain("No commits on main or develop");
  },
);
it("legacy Git still rejects a detached HEAD", () => {
  const f = fixture("TICKET-999", true);
  f.git("checkout", "--detach", "HEAD");
  const result = run(f, "commit");
  expect(result.status).toBe(2);
  expect(existsSync(f.called)).toBe(false);
});
it("legacy Git preserves ticket-prefix validation", () => {
  const f = fixture("TICKET-999", true);
  const message = join(f.path, "message.txt");
  writeFileSync(message, "fix: missing ticket prefix\n");
  const result = spawnSync(process.execPath, [textRules, "commit-msg", message], {
    cwd: f.path,
    env: f.env,
    encoding: "utf8",
  });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("TICKET-999");
});

it.each(["TICKET-999", "develop"])(
  "uses the actual execution directory when it is %s",
  (branch) => {
    const caller = fixture(branch === "develop" ? "TICKET-998" : "develop");
    const target = fixture(branch);
    const result = run(caller, "pre", {
      tool_name: "Bash",
      tool_input: {
        workdir: target.path,
        command: ["git", "commit -m example"].join(" "),
      },
    });
    expect(result.status, result.stderr).toBe(branch === "develop" ? 2 : 0);
  },
);

it.each(["TICKET-999", "develop"])("checks the explicit -C target when it is %s", (branch) => {
  const caller = fixture(branch === "develop" ? "TICKET-998" : "develop");
  const target = fixture(branch);
  const result = run(caller, "pre", {
    tool_name: "Bash",
    tool_input: { command: ["git", "-C", target.path, "commit", "-m", "example"].join(" ") },
  });
  expect(result.status, result.stderr).toBe(branch === "develop" ? 2 : 0);
});

it("keeps read-only repository inspection available", () => {
  const f = fixture();
  const result = run(f, "pre", {
    tool_name: "Bash",
    tool_input: { command: ["git", "--git-dir", join(f.path, ".git"), "status"].join(" ") },
  });
  expect(result.status, result.stderr).toBe(0);
  expect(existsSync(f.called)).toBe(false);
});
