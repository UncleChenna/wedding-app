import { afterEach, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { reusableVerification, verify, steps } from "../harness/verification.mjs";
import { isolatedGitEnv } from "./git-env";
const dirs: string[] = [];
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "verification-"));
  dirs.push(dir);
  execFileSync("git", ["init"], { cwd: dir, env: isolatedGitEnv() });
  writeFileSync(join(dir, ".gitignore"), ".harness/\n.env.local\n");
  writeFileSync(join(dir, "source.ts"), "original");
  return dir;
}
it("requires complete successful evidence and invalidates failures and input changes", () => {
  const dir = fixture();
  expect(reusableVerification(dir)).toBe(false);
  const ran: string[] = [];
  expect(
    verify(dir, (step: string) => {
      ran.push(step);
      return true;
    }),
  ).toBe(true);
  expect(ran).toEqual(steps);
  expect(reusableVerification(dir)).toBe(true);
  expect(reusableVerification(dir, Date.now() + 3600001)).toBe(false);
  writeFileSync(join(dir, "new-test.ts"), "test");
  expect(reusableVerification(dir)).toBe(false);
  verify(dir, () => true);
  writeFileSync(join(dir, ".env.local"), "CHANGED=1");
  expect(reusableVerification(dir)).toBe(false);
  verify(dir, () => true);
  expect(verify(dir, () => false)).toBe(false);
  expect(reusableVerification(dir)).toBe(false);
});
it("does not certify inputs changed during verification or malformed records", () => {
  const dir = fixture();
  verify(dir, () => {
    writeFileSync(join(dir, "source.ts"), "changed");
    return true;
  });
  expect(reusableVerification(dir)).toBe(false);
  mkdirSync(join(dir, ".harness"), { recursive: true });
  writeFileSync(join(dir, ".harness/verification.json"), '{"success":true}');
  expect(reusableVerification(dir)).toBe(false);
});
it.each(["source.ts", "pnpm-lock.yaml", "test.spec.ts", "package.json"])(
  "invalidates changed %s",
  (name) => {
    const dir = fixture();
    writeFileSync(join(dir, name), "before");
    verify(dir, () => true);
    expect(reusableVerification(dir)).toBe(true);
    writeFileSync(join(dir, name), "after");
    expect(reusableVerification(dir)).toBe(false);
  },
);
it("invalidates environment changes without persisting their values", () => {
  const dir = fixture();
  const previous = process.env.VERIFICATION_TEST_INPUT;
  try {
    process.env.VERIFICATION_TEST_INPUT = "before";
    verify(dir, () => true);
    process.env.VERIFICATION_TEST_INPUT = "after";
    expect(reusableVerification(dir)).toBe(false);
  } finally {
    if (previous === undefined) delete process.env.VERIFICATION_TEST_INPUT;
    else process.env.VERIFICATION_TEST_INPUT = previous;
  }
});

it("ignores per-command tool identifiers while keeping application inputs significant", () => {
  const dir = fixture();
  const previous = process.env.CODEX_TOOL_CALL_ID;
  try {
    process.env.CODEX_TOOL_CALL_ID = "command-one";
    verify(dir, () => true);
    process.env.CODEX_TOOL_CALL_ID = "command-two";
    expect(reusableVerification(dir)).toBe(true);
  } finally {
    if (previous === undefined) delete process.env.CODEX_TOOL_CALL_ID;
    else process.env.CODEX_TOOL_CALL_ID = previous;
  }
});
