import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
export function run(cmd, args, options = {}) {
  return execFileSync(cmd, args, {
    encoding: "utf8",
    stdio: [options.input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
    ...options,
  }).trim();
}
export function git(args, cwd = process.cwd(), extra = {}) {
  return run("git", args, { cwd, ...extra });
}
export function root(cwd = process.cwd()) {
  return git(["rev-parse", "--show-toplevel"], cwd);
}
export function common(cwd = process.cwd()) {
  return git(["rev-parse", "--path-format=absolute", "--git-common-dir"], cwd);
}
export function json(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}
export function writeJson(path, data) {
  const temp = `${path}.${process.pid}.tmp`;
  writeFileSync(temp, JSON.stringify(data, null, 2) + "\n");
  renameSync(temp, path);
}
export function pnpm(args, cwd = process.cwd(), env = process.env) {
  const result = spawnSync(process.platform === "win32" ? "pnpm.cmd" : "pnpm", args, {
    cwd,
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0)
    throw new Error(`pnpm ${args.join(" ")} failed (${result.status ?? result.error?.message}).`);
}
export async function lock(name, fn, cwd = process.cwd()) {
  const directory = join(common(cwd), `harness-${name}.lock`);
  try {
    mkdirSync(directory);
  } catch {
    throw new Error(
      `Another harness operation holds ${directory}. If its process has died, remove this lock manually.`,
    );
  }
  try {
    return await fn();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
export function isMain(meta) {
  return /^(main|master)$/.test(meta);
}
export function cli(main) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
export function entry(url) {
  return process.argv[1] && fileURLToPath(url) === resolve(process.argv[1]);
}
