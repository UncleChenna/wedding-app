import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, expect, it } from "vitest";
import { isolatedGitEnv } from "./git-env";

const root = resolve(import.meta.dirname, "../..");
const parity = "scripts/__tests__/ci-parity.test.ts";
const folders: string[] = [];
afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});
function fixture() {
  const folder = mkdtempSync(join(tmpdir(), "quick-parity-"));
  folders.push(folder);
  const env = isolatedGitEnv({ GIT_CONFIG_GLOBAL: "/dev/null" });
  const git = (...args: string[]) => execFileSync("git", args, { cwd: folder, env, stdio: "pipe" });
  const write = (path: string, text: string) => {
    mkdirSync(resolve(folder, path, ".."), { recursive: true });
    writeFileSync(join(folder, path), text);
  };
  git("init", "-q");
  git("config", "user.email", "fixture@example.invalid");
  git("config", "user.name", "Fixture");
  write(".gitignore", "node_modules\ncommands.jsonl\nbin/\nvitest.config.mjs\n");
  write("src/value.ts", "export const value = 1;\n");
  write(".github/workflows/ci.yml", readFileSync(join(root, ".github/workflows/ci.yml"), "utf8"));
  write(".env.example", readFileSync(join(root, ".env.example"), "utf8"));
  write(parity, readFileSync(join(root, parity), "utf8"));
  for (const file of ["ci-verify.mjs", "ci-plan.mjs", "ci-selection.mjs"]) {
    write(`scripts/${file}`, readFileSync(join(root, "scripts", file), "utf8"));
  }
  git("add", ".");
  git("commit", "-qm", "fixture baseline");
  git("update-ref", "refs/remotes/origin/develop", "HEAD");
  write(
    "bin/pnpm",
    `#!${process.execPath}
const fs = require('node:fs');
const cp = require('node:child_process');
const args = process.argv.slice(2);
fs.appendFileSync('commands.jsonl', JSON.stringify(args)+'\\n');
if (process.env.RUN_REAL_PARITY === '1' && args.includes('${parity}') && args.includes('run')) {
  const result = cp.spawnSync(process.execPath, [${JSON.stringify(resolve(root, "node_modules/vitest/vitest.mjs"))}, 'run', '${parity}', '--config', 'vitest.config.mjs'], {stdio: 'inherit'});
  process.exit(result.status ?? 1);
}
process.exit(process.env.FAIL_PARITY === '1' && args.includes('${parity}') ? 7 : 0);
`,
  );
  chmodSync(join(folder, "bin/pnpm"), 0o755);
  const run = (extra: Record<string, string> = {}) => {
    writeFileSync(join(folder, "commands.jsonl"), "");
    const result = spawnSync(process.execPath, [join(root, "scripts/verify-quick.mjs")], {
      cwd: folder,
      env: { ...env, PATH: `${join(folder, "bin")}:${process.env.PATH ?? ""}`, ...extra },
      encoding: "utf8",
    });
    const commands = readFileSync(join(folder, "commands.jsonl"), "utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as string[]);
    return { ...result, commands };
  };
  return { folder, git, write, run };
}
it.each(["working", "staged", "committed", "untracked"])(
  "runs explicit parity for %s workflow changes",
  (mode) => {
    const f = fixture();
    const path = mode === "untracked" ? ".github/workflows/new.yml" : ".github/workflows/ci.yml";
    f.write(
      path,
      `${readFileSync(join(f.folder, ".github/workflows/ci.yml"), "utf8")}\n# changed\n`,
    );
    if (mode === "staged" || mode === "committed") f.git("add", path);
    if (mode === "committed") f.git("commit", "-qm", "workflow-only change");
    const result = f.run();
    expect(result.status).toBe(0);
    expect(result.commands).toContainEqual(["-s", "exec", "vitest", "run", parity]);
  },
);
it("runs parity for an environment-only change and propagates its failure", () => {
  const f = fixture();
  f.write(".env.example", "# changed\n");
  const result = f.run({ FAIL_PARITY: "1" });
  expect(result.status).toBe(1);
  expect(result.commands.slice(0, 2)).toEqual([
    ["-s", "lint"],
    ["-s", "typecheck"],
  ]);
  expect(result.stdout).toContain("✖");
});
it("preserves source-only related selection and avoids duplicate explicit parity", () => {
  const f = fixture();
  f.write("src/value.ts", "export const value = 2;\n");
  expect(f.run().commands).toEqual([
    ["-s", "lint"],
    ["-s", "typecheck"],
    ["-s", "exec", "vitest", "related", "--run", "--passWithNoTests", "src/value.ts"],
  ]);
  f.write(".env.example", "# changed\n");
  f.write(parity, "// test changed\n");
  const result = f.run();
  expect(
    result.commands.filter((args) => args.includes("run") && args.includes(parity)),
  ).toHaveLength(1);
  expect(result.commands.find((args) => args.includes("related"))).toContain(`--exclude=${parity}`);
});
it("fails the real existing parity assertion for an undocumented flag and passes after documentation", () => {
  const f = fixture();
  symlinkSync(join(root, "node_modules"), join(f.folder, "node_modules"), "dir");
  f.write(
    "vitest.config.mjs",
    "export default { test: { environment: 'node', include: ['scripts/__tests__/ci-parity.test.ts'] } };\n",
  );
  const workflow = readFileSync(join(f.folder, ".github/workflows/ci.yml"), "utf8");
  f.write(
    ".github/workflows/ci.yml",
    workflow.replace("env:\n", "env:\n  NEW_UNDOCUMENTED_FIXTURE_FLAG: '1'\n"),
  );
  const red = f.run({ RUN_REAL_PARITY: "1" });
  expect(red.status).toBe(1);
  expect(red.stdout + red.stderr).toContain(
    "Missing CI variable documentation: NEW_UNDOCUMENTED_FIXTURE_FLAG",
  );
  f.write(
    ".env.example",
    readFileSync(join(f.folder, ".env.example"), "utf8") +
      "\n# NEW_UNDOCUMENTED_FIXTURE_FLAG: fixture-only\n",
  );
  expect(f.run({ RUN_REAL_PARITY: "1" }).status).toBe(0);
}, 15000);
it("detects a deleted or renamed-away workflow without losing its old path", () => {
  const f = fixture();
  f.git("mv", ".github/workflows/ci.yml", "old-ci.yml");
  expect(f.run().commands).toContainEqual(["-s", "exec", "vitest", "run", parity]);
  f.git("commit", "-qm", "move workflow out of watched directory");
  expect(f.run().commands).toContainEqual(["-s", "exec", "vitest", "run", parity]);
});
it("keeps the full-suite fallback for a repository without commits", () => {
  const f = fixture();
  f.git("checkout", "--orphan", "unborn");
  const result = f.run();
  expect(result.status).toBe(0);
  expect(result.commands).toEqual([
    ["-s", "lint"],
    ["-s", "typecheck"],
    ["-s", "exec", "vitest", "run"],
  ]);
});
it("runs local parity without a remote base and fails closed when a present base has no common ancestor", () => {
  const f = fixture();
  f.git("update-ref", "-d", "refs/remotes/origin/develop");
  f.write(".env.example", "# changed\n");
  expect(f.run().commands).toContainEqual(["-s", "exec", "vitest", "run", parity]);
  f.git("restore", ".env.example");
  const tree = f.git("rev-parse", "HEAD^{tree}").toString().trim();
  const orphan = f.git("commit-tree", tree, "-m", "unrelated remote history").toString().trim();
  f.git("update-ref", "refs/remotes/origin/develop", orphan);
  expect(f.run().commands).toContainEqual(["-s", "exec", "vitest", "run", parity]);
});
it("does not add parity or change committed source-only selection for unrelated changes", () => {
  const f = fixture();
  f.write("notes.md", "documentation only\n");
  expect(f.run().commands).toEqual([
    ["-s", "lint"],
    ["-s", "typecheck"],
  ]);
  f.write("src/value.ts", "export const value = 3;\n");
  f.git("add", "src/value.ts");
  f.git("commit", "-qm", "source-only change");
  expect(f.run().commands).toEqual([
    ["-s", "lint"],
    ["-s", "typecheck"],
  ]);
});
