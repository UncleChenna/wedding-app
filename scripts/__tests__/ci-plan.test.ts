import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { afterEach, expect, it } from "vitest";
import { planForEvent } from "../ci-plan.mjs";
import { verificationCommands } from "../ci-verify.mjs";
import { isolatedGitEnv } from "./git-env";
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "ci-plan-"));
  roots.push(root);
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: root, env: isolatedGitEnv(), encoding: "utf8" }).trim();
  git("init", "-q");
  git("config", "user.name", "Test");
  git("config", "user.email", "test@example.test");
  mkdirSync(join(root, "src/modules/admin/lib"), { recursive: true });
  const file = "src/modules/admin/lib/count.ts";
  writeFileSync(join(root, file), "export const count = 1;\n");
  git("add", ".");
  git("commit", "-qm", "base");
  const base = git("rev-parse", "HEAD");
  return { root, git, file, base };
}
it("uses actual committed PR paths on a clean checkout and follows indirect test dependencies", () => {
  const { root, git, file, base } = fixture();
  writeFileSync(join(root, file), "export const count = 2;\n");
  git("commit", "-qam", "change");
  const head = git("rev-parse", "HEAD");
  expect(git("status", "--porcelain")).toBe("");
  const plan = planForEvent(
    "pull_request",
    { pull_request: { base: { sha: base }, head: { sha: head }, labels: [] } },
    root,
  );
  expect(plan).toMatchObject({ full: false, paths: [file], base, head });
  const command = verificationCommands(plan).find((args: string[]) => args.includes("related"));
  expect(command).toContain(file);
  // Exercise the actual Vitest dependency graph, not a mocked argument collector.
  writeFileSync(join(root, "bridge.ts"), `export { count } from './${file}';\n`);
  writeFileSync(
    join(root, "affected.test.ts"),
    "import {count} from './bridge'; test('affected assertion',()=>expect(count).toBe(1));\n",
  );
  writeFileSync(
    join(root, "unrelated.test.ts"),
    "test('unrelated assertion',()=>expect(false).toBe(true));\n",
  );
  writeFileSync(
    join(root, "vitest.config.mjs"),
    "export default {test:{globals:true,include:['*.test.ts']}};\n",
  );
  const run = () =>
    spawnSync(
      process.execPath,
      [
        resolve("node_modules/vitest/vitest.mjs"),
        "related",
        "--run",
        "--root",
        root,
        "--config",
        join(root, "vitest.config.mjs"),
        file,
      ],
      { cwd: root, encoding: "utf8", env: isolatedGitEnv() },
    );
  const red = run();
  expect(red.status).toBe(1);
  expect(red.stdout + red.stderr).toContain("affected assertion");
  expect(red.stdout + red.stderr).not.toContain("unrelated assertion");
  writeFileSync(join(root, file), "export const count = 1;\n");
  const green = run();
  expect(green.status, green.stdout + green.stderr).toBe(0);
}, 15000);
it("deletions, inaccessible SHAs, manual/release and explicit full labels retain complete checks", () => {
  const { root, git, file, base } = fixture();
  git("rm", file);
  git("commit", "-qm", "delete");
  const event = {
    pull_request: { base: { sha: base }, head: { sha: git("rev-parse", "HEAD") }, labels: [] },
  };
  expect(planForEvent("pull_request", event, root).full).toBe(true);
  for (const name of ["workflow_dispatch", "release", "push"])
    expect(planForEvent(name, {}, root).full).toBe(true);
  expect(
    planForEvent("pull_request", { pull_request: { labels: [{ name: "ci:full" }] } }, root).full,
  ).toBe(true);
  expect(planForEvent("pull_request", {}, root).full).toBe(true);
  expect(verificationCommands({ full: true })).toEqual([
    ["pnpm", "verify"],
    ["pnpm", "test:gate"],
  ]);
});
it("aggregate process fails when selection failed rather than blessing skipped checks", () => {
  const { root } = fixture();
  const summary = join(root, "summary");
  const result = spawnSync(process.execPath, [resolve("scripts/ci-gate.mjs")], {
    encoding: "utf8",
    env: {
      ...process.env,
      CI_NEEDS: JSON.stringify({ plan: { result: "failure" } }),
      GITHUB_STEP_SUMMARY: summary,
    },
  });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("Missing or failed CI selection");
});
it("metadata-only events use distinct check names and concurrency while base edits retain code checks", () => {
  const workflow = readFileSync(resolve(".github/workflows/ci.yml"), "utf8");
  const ignored =
    "((github.event.action == 'edited' && !github.event.changes.base) || (github.event.action == 'labeled' && github.event.label.name != 'ci:full'))";
  const names = [...workflow.matchAll(/^    name: (.+)$/gm)].map((match) => match[1]);
  expect(names.length).toBeGreaterThanOrEqual(10);
  for (const name of names) {
    expect(name).toContain(ignored);
    expect(name).toContain("(metadata only)");
  }
  expect(workflow).toContain(`${ignored} && github.run_id || 'code'`);
  expect(workflow).toContain("github.event.action == 'edited' && github.event.changes.base");
  const text = readFileSync(resolve(".github/workflows/pr-text.yml"), "utf8");
  expect(text).toContain("types: [edited]");
  expect(text).toContain("group: pr-text-");
});

it("includes imported JSON in committed dependency-aware unit selection", () => {
  const plan = { full: false, ui: true, paths: ["src/modules/admin/lib/options.json"] };
  const commands = verificationCommands(plan);
  expect(commands.find((args: string[]) => args.includes("related"))).toContain(plan.paths[0]);
  expect(commands.some((args: string[]) => args.includes("e2e/smoke.spec.ts"))).toBe(true);
});

it("uses a changed divergent base for the same PR head rather than stale origin/develop", () => {
  const { root, git, file, base } = fixture();
  writeFileSync(join(root, file), "export const count = 2;\n");
  git("commit", "-qam", "feature");
  const head = git("rev-parse", "HEAD");
  git("checkout", "-qb", "new-base", base);
  writeFileSync(join(root, "base.md"), "base only");
  git("add", ".");
  git("commit", "-qm", "new base");
  const changedBase = git("rev-parse", "HEAD");
  git("checkout", "-q", head);
  const plan = planForEvent(
    "pull_request",
    {
      action: "edited",
      changes: { base: {} },
      pull_request: { base: { sha: changedBase }, head: { sha: head }, labels: [] },
    },
    root,
  );
  expect(plan.base).toBe(changedBase);
  expect(plan.head).toBe(head);
  expect(plan.paths).toEqual([file]);
  expect(plan.full).toBe(false);
});
