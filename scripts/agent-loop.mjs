#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { cli, common, pnpm, root } from "./harness/io.mjs";
import { changeTask, readLedger } from "./task.mjs";
cli(async () => {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log(
      "agent:loop [--task ID] [--module MODULE] [--max-iterations N] [--dry-run]. Runs Claude in one isolated checkout per task, then verifies and opens its PR.",
    );
    return;
  }
  const option = (key, fallback) => (args.includes(key) ? args[args.indexOf(key) + 1] : fallback);
  const supported = new Set([
    "--task",
    "--module",
    "--max-iterations",
    "--model",
    "--max-budget-usd",
  ]);
  for (let n = 0; n < args.length; n++) {
    if (args[n] === "--dry-run") continue;
    if (!supported.has(args[n]) || !args[n + 1] || args[n + 1].startsWith("--"))
      throw new Error(`Unknown or incomplete option: ${args[n]}`);
    n++;
  }
  const max = Number(option("--max-iterations", "1"));
  if (!Number.isInteger(max) || max < 1) throw new Error("Invalid iteration count.");
  const cwd = root();
  for (let i = 0; i < max; i++) {
    const tasks = readLedger(cwd).data.tasks;
    const id = option("--task", null);
    const task = tasks.find(
      (t) =>
        (id
          ? t.id === id
          : t.status === "todo" &&
            !t.blocked_reason &&
            (!option("--module", null) || t.module === option("--module", null))) &&
        (t.dependsOn ?? []).every((d) => tasks.some((x) => x.id === d && x.status === "done")),
    );
    if (!task) {
      console.log("No runnable task.");
      return;
    }
    if (args.includes("--dry-run")) {
      console.log(
        `Would claim ${task.id}, create its worktree, run implement-task, verify and open a PR.`,
      );
      return;
    }
    await changeTask(cwd, "claim", task.id);
    pnpm(["wt:new", task.id], cwd);
    const path = join(dirname(common(cwd)), ".worktrees", task.id);
    const result = spawnSync(
      "claude",
      [
        "-p",
        `Use the implement-task skill for ${task.id}. The task is already claimed for this session and this is its managed worktree. Stop after committing; the outer harness opens the PR.`,
        "--permission-mode",
        "acceptEdits",
        "--output-format",
        "text",
        ...(option("--model", null) ? ["--model", option("--model", null)] : []),
        ...(option("--max-budget-usd", null)
          ? ["--max-budget-usd", option("--max-budget-usd", null)]
          : []),
      ],
      { cwd: path, stdio: "inherit" },
    );
    if (result.status !== 0)
      throw new Error(
        `Agent failed on ${task.id}; claim retained. Write a handoff before retrying.`,
      );
    pnpm(["task:pr", task.id], path);
    if (id) return;
  }
});
