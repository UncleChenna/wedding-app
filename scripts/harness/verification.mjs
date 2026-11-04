import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { pnpmRuntime } from "./pnpm-runtime.mjs";

export const steps = [
  "t:validate",
  "format:check",
  "lint",
  "typecheck",
  "test",
  "build",
  "test:e2e:smoke",
];
const evidencePath = (cwd) => join(cwd, ".harness/verification.json");
export function fingerprint(cwd) {
  const hash = createHash("sha256");
  hash.update(JSON.stringify([process.version, process.platform, process.arch]));
  // Hash values, never store or print the environment (which can contain secrets).
  hash.update(
    JSON.stringify(
      Object.entries(process.env)
        .filter(
          ([key]) =>
            !/^(?:npm_|pnpm_|PNPM_|CODEX_TOOL_CALL_ID$|INIT_CWD$|PWD$|OLDPWD$|SHLVL$|_$|GIT_|TICKETS_VERIFIED_SHA$)/.test(
              key,
            ),
        )
        .sort(),
    ),
  );
  const names = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    {
      cwd,
      encoding: "utf8",
      env: Object.fromEntries(
        Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_")),
      ),
    },
  )
    .split("\0")
    .filter(Boolean);
  // Ignored configuration and installed package metadata also affect verification.
  names.push(".env.local", "node_modules/.modules.yaml", "node_modules/.pnpm/lock.yaml");
  for (const name of [...new Set(names)].sort()) {
    hash.update(name + "\0");
    const path = join(cwd, name);
    if (!existsSync(path)) {
      hash.update("missing\0");
      continue;
    }
    const stat = lstatSync(path);
    hash.update(String(stat.mode) + "\0");
    if (stat.isSymbolicLink()) hash.update(readlinkSync(path));
    else if (stat.isFile()) hash.update(readFileSync(path));
    else hash.update("directory");
  }
  return hash.digest("hex");
}
export function reusableVerification(cwd, now = Date.now()) {
  try {
    const record = JSON.parse(readFileSync(evidencePath(cwd), "utf8"));
    return (
      record.version === 1 &&
      record.success === true &&
      Number.isFinite(record.finishedAt) &&
      record.finishedAt <= now &&
      now - record.finishedAt < 60 * 60 * 1000 &&
      JSON.stringify(record.steps) === JSON.stringify(steps) &&
      record.fingerprint === fingerprint(cwd)
    );
  } catch {
    return false;
  }
}
export function verify(cwd, run) {
  const file = evidencePath(cwd);
  rmSync(file, { force: true });
  const before = fingerprint(cwd);
  for (const step of steps) if (!run(step)) return false;
  if (before !== fingerprint(cwd)) {
    console.log("Inputs changed during verification; rerun against stable inputs before review.");
    return false;
  }
  mkdirSync(join(cwd, ".harness"), { recursive: true });
  writeFileSync(
    file,
    JSON.stringify({
      version: 1,
      success: true,
      finishedAt: Date.now(),
      fingerprint: before,
      steps,
    }) + "\n",
    { mode: 0o600 },
  );
  return true;
}
export function runVerification(cwd) {
  const runtime = pnpmRuntime();
  return verify(
    cwd,
    (step) =>
      spawnSync(runtime.executable, [step], {
        cwd,
        env: runtime.env,
        stdio: "inherit",
        shell: process.platform === "win32",
      }).status === 0,
  );
}
