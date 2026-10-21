#!/usr/bin/env node
/**
 * Fast feedback gate: lint, typecheck, and the unit tests related to changed
 * files (vs HEAD, plus untracked). Runs every step even if one fails, then
 * exits non-zero if any failed. Used by the Claude Code Stop hook.
 */
import { execFileSync, spawnSync } from "node:child_process";

function git(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
      .split("\n")
      .filter(Boolean);
  } catch {
    return null;
  }
}

const hasHead = git(["rev-parse", "--verify", "HEAD"]) !== null;
const changed = [
  ...new Set([
    ...(hasHead ? (git(["diff", "--name-only", "--diff-filter=ACMR", "HEAD"]) ?? []) : []),
    ...(git(["ls-files", "--others", "--exclude-standard"]) ?? []),
  ]),
];
const testable = changed.filter((f) => /^(src|scripts)\/.*\.([cm]?[jt]sx?|json)$/.test(f));

const steps = [
  ["lint", ["pnpm", "-s", "lint"]],
  ["typecheck", ["pnpm", "-s", "typecheck"]],
  !hasHead
    ? ["unit tests (no commits yet: all)", ["pnpm", "-s", "exec", "vitest", "run"]]
    : testable.length > 0
      ? [
          `unit tests related to ${testable.length} changed file(s)`,
          ["pnpm", "-s", "exec", "vitest", "related", "--run", "--passWithNoTests", ...testable],
        ]
      : null,
].filter(Boolean);

const results = [];
for (const [name, [cmd, ...args]] of steps) {
  console.log(`\n▶ ${name}`);
  const { status } = spawnSync(cmd, args, { stdio: "inherit" });
  results.push([name, status === 0]);
}
if (hasHead && testable.length === 0) results.push(["unit tests (no changed source files)", true]);

console.log("\nverify:quick summary");
for (const [name, ok] of results) console.log(`  ${ok ? "✔" : "✖"} ${name}`);
process.exit(results.every(([, ok]) => ok) ? 0 : 1);
