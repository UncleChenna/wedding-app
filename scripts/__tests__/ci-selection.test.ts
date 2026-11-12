import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { classifyChanges, changedPaths, validateGates } from "../ci-selection.mjs";
import { isolatedGitEnv } from "./git-env";

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));

describe("CI selection", () => {
  it("uses committed base/head paths including both sides of renames and deletion", () => {
    const root = mkdtempSync(join(tmpdir(), "ci-selection-"));
    roots.push(root);
    const git = (...args: string[]) =>
      execFileSync("git", args, { cwd: root, env: isolatedGitEnv(), encoding: "utf8" }).trim();
    git("init");
    git("config", "user.name", "Test");
    git("config", "user.email", "test@example.test");
    writeFileSync(join(root, "old name.ts"), "same\n");
    writeFileSync(join(root, "deleted.ts"), "gone\n");
    git("add", ".");
    git("commit", "-m", "base");
    const base = git("rev-parse", "HEAD");
    git("mv", "old name.ts", "new\nname.ts");
    git("rm", "deleted.ts");
    git("commit", "-am", "head");
    expect(changedPaths(root, base, git("rev-parse", "HEAD"))).toEqual(
      expect.arrayContaining(["old name.ts", "new\nname.ts", "deleted.ts"]),
    );
    expect(() => changedPaths(root, "missing", "HEAD")).toThrow();
  });
  it("fails closed for empty, shared, tooling and unknown inputs", () => {
    for (const files of [
      [],
      ["src/modules/shared/ui/button.tsx"],
      ["package.json"],
      [".github/workflows/ci.yml"],
      ["unknown.file"],
    ])
      expect(classifyChanges(files).full).toBe(true);
  });
  it("selects UI smoke and affected feature integrations", () => {
    expect(classifyChanges(["src/modules/admin/components/guests.tsx"])).toMatchObject({
      full: false,
      ui: true,
      admin: true,
    });
    expect(classifyChanges(["src/modules/checkin/lib/token.ts"])).toMatchObject({
      camera: true,
      guest: true,
      admin: true,
    });
    expect(classifyChanges(["src/modules/invitations/server/rsvp.ts"])).toMatchObject({
      database: true,
      guest: true,
      admin: true,
    });
  });
  it("keeps documentation-only changes bounded and honors explicit full mode", () => {
    expect(classifyChanges(["docs/handoffs/TICKET-001.md"])).toMatchObject({
      full: false,
      ui: false,
      guest: false,
    });
    expect(classifyChanges(["docs/handoffs/TICKET-001.md"], true).full).toBe(true);
  });
  it("rejects failures and unexpected skips without inventing execution", () => {
    expect(
      validateGates({ verify: true, guest: false }, { verify: "success", guest: "skipped" }).ok,
    ).toBe(true);
    for (const result of ["failure", "cancelled", "skipped", undefined])
      expect(validateGates({ verify: true }, { verify: result }).ok).toBe(false);
    expect(validateGates({ guest: false }, { guest: "failure" }).ok).toBe(false);
  });
});

it("keeps mixed documentation/source changes and non-TSX UI assets in scope", () => {
  expect(
    classifyChanges(["docs/review.md", "src/modules/ordering/components/menu.css"]),
  ).toMatchObject({ full: false, ui: true, guest: true });
  expect(classifyChanges(["src/modules/admin/components/menu.json"])).toMatchObject({
    ui: true,
    admin: true,
  });
  expect(classifyChanges(["src/modules/admin/unknown.wasm"]).full).toBe(true);
});
