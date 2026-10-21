#!/usr/bin/env node
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { changeTask, owner, readLedger } from "./task.mjs";
import { cli, git, pnpm, root, run } from "./harness/io.mjs";
cli(async () => {
  const finish = process.argv.includes("--finish");
  const id = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const cwd = root();
  const task = readLedger(cwd).data.tasks.find((t) => t.id === id);
  if (!task || task.owner !== owner(cwd)) throw new Error("Task must be claimed by you.");
  run("gh", ["auth", "status"], { cwd });
  if (finish) {
    const pr = JSON.parse(
      run("gh", ["pr", "view", task.branch, "--json", "state,mergedAt,url,headRefName"], { cwd }),
    );
    if (pr.state !== "MERGED" || !pr.mergedAt || pr.headRefName !== task.branch)
      throw new Error("Task PR is not merged.");
    await changeTask(cwd, "done", id);
    console.log(`Done: ${pr.url}. Run task:sync on your next branch to update the snapshot.`);
    return;
  }
  if (
    git(["branch", "--show-current"], cwd) !== task.branch ||
    !existsSync(join(cwd, ".harness/worktree.json"))
  )
    throw new Error("Run task:pr in the task's managed worktree.");
  if (git(["status", "--porcelain"], cwd))
    throw new Error("Commit all task work before opening the PR.");
  pnpm(["verify"], cwd);
  const body = join(cwd, "docs/plans", `${id}-pr.md`);
  if (!existsSync(body))
    throw new Error(
      `Write and commit ${body} using .github/pull_request_template.md, including evidence, then retry.`,
    );
  git(["push", "-u", "origin", task.branch], cwd);
  let url;
  try {
    url = run("gh", ["pr", "view", task.branch, "--json", "url", "--jq", ".url"], { cwd });
  } catch {
    const temp = mkdtempSync(join(tmpdir(), "wedding-pr-"));
    try {
      const file = join(temp, "body.md");
      writeFileSync(file, readFileSync(body));
      url = run(
        "gh",
        [
          "pr",
          "create",
          "--base",
          "main",
          "--head",
          task.branch,
          "--title",
          `${id}: ${task.title}`,
          "--body-file",
          file,
        ],
        { cwd },
      );
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  }
  if (task.status === "claimed") await changeTask(cwd, "review", id);
  console.log(url);
});
