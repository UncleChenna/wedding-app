import { afterEach, expect, it } from "vitest";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { pnpmRuntime } from "../harness/pnpm-runtime.mjs";

const scratch: string[] = [];
function fixture() {
  const home = mkdtempSync(join(tmpdir(), "hook-pnpm-"));
  scratch.push(home);
  const bin = join(home, ".npm-global/bin");
  mkdirSync(bin, { recursive: true });
  const executable = join(bin, "pnpm");
  writeFileSync(
    executable,
    '#!/usr/bin/env node\nconsole.log(process.argv.slice(2).join(" "));process.exit(Number(process.env.TEST_EXIT || 0));\n',
  );
  chmodSync(executable, 0o755);
  const runtimeBin = join(home, "runtime");
  mkdirSync(runtimeBin);
  const node = join(runtimeBin, "node");
  symlinkSync(process.execPath, node);
  return { home, bin, executable, node };
}
afterEach(() => {
  for (const path of scratch.splice(0)) rmSync(path, { recursive: true, force: true });
});
it("finds a user npm installation and provides Node to nested commands", () => {
  const { home, bin, executable, node } = fixture();
  const runtime = pnpmRuntime({ PATH: "/usr/bin:/bin" }, home, node);
  expect(runtime.executable).toBe(executable);
  expect(runtime.env.PATH.split(delimiter)).toContain(bin);
  expect(runtime.env.PATH.split(delimiter)).toContain(dirname(node));
  const child = spawnSync(runtime.executable, ["verify:quick"], {
    env: { ...process.env, ...runtime.env },
    encoding: "utf8",
  });
  expect(child.status).toBe(0);
  expect(child.stdout).toContain("verify:quick");
});
it("preserves an existing PATH-selected pnpm", () => {
  const first = fixture();
  const second = fixture();
  expect(pnpmRuntime({ PATH: first.bin, PNPM_HOME: second.bin }, second.home).executable).toBe(
    first.executable,
  );
});
it("uses PNPM_HOME and fails with actionable guidance when no executable exists", () => {
  const { home, bin, executable, node } = fixture();
  expect(pnpmRuntime({ PATH: "/nonexistent", PNPM_HOME: bin }, home, node).executable).toBe(
    executable,
  );
  expect(() => pnpmRuntime({ PATH: "/nonexistent" }, "/nonexistent", "/nonexistent/node")).toThrow(
    /pnpm.*PATH/,
  );
});
it.each([0, 1])("the actual stop hook runs verification and preserves exit %s", (exit) => {
  const { home } = fixture();
  const result = spawnSync(
    process.execPath,
    [resolve("scripts/harness/hooks.mjs"), "stop", "codex"],
    {
      input: JSON.stringify({ cwd: process.cwd() }),
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: "/usr/bin:/bin",
        PNPM_HOME: join(home, ".npm-global/bin"),
        TEST_EXIT: String(exit),
      },
    },
  );
  expect(result.status).toBe(exit ? 2 : 0);
  expect(exit ? result.stderr : result.stdout).toContain(exit ? "verify:quick" : "{}");
});
