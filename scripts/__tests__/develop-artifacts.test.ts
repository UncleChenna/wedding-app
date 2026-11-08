import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { unchangedDevelopArtifact } from "../harness/develop-artifacts.mjs";
import { isolatedGitEnv } from "./git-env";
const dirs: string[] = [];
beforeEach(() => {
  for (const key of Object.keys(process.env))
    if (key.startsWith("GIT_")) vi.stubEnv(key, undefined);
});
afterEach(() => vi.unstubAllEnvs());
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));
it("accepts only regular staged artifacts identical to the fetched develop tree", () => {
  const dir = mkdtempSync(join(tmpdir(), "develop-artifacts-"));
  dirs.push(dir);
  const git = (...args: string[]) => execFileSync("git", args, { cwd: dir, env: isolatedGitEnv() });
  git("init");
  writeFileSync(join(dir, "pnpm-lock.yaml"), "version: 1\n");
  git("add", "pnpm-lock.yaml");
  git("-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "fixture");
  expect(unchangedDevelopArtifact(dir, "pnpm-lock.yaml")).toBe(false);
  git("update-ref", "refs/remotes/origin/develop", "HEAD");
  expect(unchangedDevelopArtifact(dir, "pnpm-lock.yaml")).toBe(true);
  for (const path of [
    ".env.local",
    "../pnpm-lock.yaml",
    "/pnpm-lock.yaml",
    "node_modules/a",
    "drizzle/missing.sql",
  ])
    expect(unchangedDevelopArtifact(dir, path)).toBe(false);
  writeFileSync(join(dir, "pnpm-lock.yaml"), "version: 2\n");
  git("add", "pnpm-lock.yaml");
  expect(unchangedDevelopArtifact(dir, "pnpm-lock.yaml")).toBe(false);
  git("rm", "--cached", "pnpm-lock.yaml");
  expect(unchangedDevelopArtifact(dir, "pnpm-lock.yaml")).toBe(false);
});
