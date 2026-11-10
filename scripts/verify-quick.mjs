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
// Workflow/environment reads are dynamic dependencies, invisible to Vitest's import graph.
// Also inspect committed branch changes: t:pr normally runs after source is committed.
const hasBase = hasHead && git(["rev-parse", "--verify", "refs/remotes/origin/develop"]) !== null;
const branchChanges = hasBase
  ? git(["diff", "--name-only", "--no-renames", "origin/develop...HEAD"])
  : [];
const parityTest = "scripts/__tests__/ci-parity.test.ts";
const needsParity =
  hasHead &&
  // A present but unusable base (e.g. shallow history) must not silently omit this check.
  (branchChanges === null ||
    [
      ...changed,
      ...(hasHead ? (git(["diff", "--name-only", "--no-renames", "HEAD"]) ?? []) : []),
      ...(branchChanges ?? []),
    ].some((path) => path === ".env.example" || path.startsWith(".github/workflows/")));
const testable = changed.filter((f) => /^(src|scripts)\/.*\.([cm]?[jt]sx?|json)$/.test(f));

const steps = [
  ["lint", ["pnpm", "-s", "lint"]],
  ["typecheck", ["pnpm", "-s", "typecheck"]],
  !hasHead
    ? ["unit tests (no commits yet: all)", ["pnpm", "-s", "exec", "vitest", "run"]]
    : testable.length > 0
      ? [
          `unit tests related to ${testable.length} changed file(s)`,
          [
            "pnpm",
            "-s",
            "exec",
            "vitest",
            "related",
            "--run",
            "--passWithNoTests",
            ...(needsParity ? [`--exclude=${parityTest}`] : []),
            ...testable,
          ],
        ]
      : null,
  needsParity
    ? [
        "CI parity for workflow/environment changes",
        ["pnpm", "-s", "exec", "vitest", "run", parityTest],
      ]
    : null,
].filter(Boolean);

const results = [];
for (const [name, [cmd, ...args]] of steps) {
  console.log(`\n▶ ${name}`);
  const { status } = spawnSync(cmd, args, { stdio: "inherit" });
  results.push([name, status === 0]);
}
if (hasHead && testable.length === 0 && !needsParity)
  results.push(["unit tests (no changed source files)", true]);

console.log("\nverify:quick summary");
for (const [name, ok] of results) console.log(`  ${ok ? "✔" : "✖"} ${name}`);
process.exit(results.every(([, ok]) => ok) ? 0 : 1);
