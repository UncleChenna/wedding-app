#!/usr/bin/env node
/** Fast check: lint, types, and the unit tests related to uncommitted changes. */
import { execFileSync, spawnSync } from "node:child_process";

function lines(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

const changed = [
  ...new Set([
    ...lines(["diff", "--name-only", "--diff-filter=ACMR", "HEAD"]),
    ...lines(["ls-files", "--others", "--exclude-standard"]),
  ]),
].filter((f) => /^(src|scripts)\/.*\.([cm]?[jt]sx?|json)$/.test(f));

const steps = [
  ["lint", ["lint"]],
  ["typecheck", ["typecheck"]],
  ...(changed.length
    ? [
        [
          "related unit tests",
          ["exec", "vitest", "related", "--run", "--passWithNoTests", ...changed],
        ],
      ]
    : []),
];
let ok = true;
for (const [name, args] of steps) {
  console.log(`\n▶ ${name}`);
  if (spawnSync("pnpm", ["-s", ...args], { stdio: "inherit" }).status !== 0) ok = false;
}
process.exit(ok ? 0 : 1);
