import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { environmentPlan } from "./ci-plan.mjs";

export function verificationCommands(plan) {
  if (plan.full)
    return [
      ["pnpm", "verify"],
      ["pnpm", "test:gate"],
    ];
  const commands = [
    ["pnpm", "format:check"],
    ["pnpm", "lint"],
    ["pnpm", "typecheck"],
  ];
  const sources = plan.paths.filter((path) => /^src\/.*\.(?:[cm]?[jt]sx?|json)$/.test(path));
  // related follows Vitest's import graph, including indirect consumers, against committed PR inputs.
  if (sources.length)
    commands.push([
      "pnpm",
      "exec",
      "vitest",
      "related",
      "--run",
      "--maxWorkers=2",
      "--passWithNoTests",
      ...sources,
    ]);
  const tests = sources.filter((path) => /\.test\.[jt]sx?$/.test(path));
  if (tests.length) commands.push(["pnpm", "exec", "vitest", "run", "--maxWorkers=2", ...tests]);
  if (plan.ui)
    commands.push(
      ["pnpm", "build"],
      [
        "pnpm",
        "exec",
        "playwright",
        "test",
        "e2e/smoke.spec.ts",
        "--project=mobile",
        "--project=desktop",
      ],
    );
  return commands;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const plan = environmentPlan();
  console.log(`Verification: ${plan.reason}; full=${plan.full}`);
  let failed = false;
  for (const [command, ...args] of verificationCommands(plan)) {
    console.log(`▶ ${command} ${args.join(" ")}`);
    if (spawnSync(command, args, { stdio: "inherit" }).status !== 0) failed = true;
  }
  if (failed) process.exitCode = 1;
}
