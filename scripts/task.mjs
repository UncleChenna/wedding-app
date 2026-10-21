#!/usr/bin/env node
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { safeId, transitionTask } from "./harness/core.mjs";
import { cli, git, json, lock, root, entry, run } from "./harness/io.mjs";
const REF = "refs/heads/agent-tasks";
export function owner(cwd) {
  let value = process.env.AGENT_OWNER;
  if (!value) {
    try {
      value = git(["config", "--get", "harness.owner"], cwd);
    } catch {
      /* configured below */
    }
  }
  if (!value)
    throw new Error("Set your identity once: git config harness.owner divine (or friend).");
  return safeId(value);
}
export function readLedger(cwd, local = false) {
  let sha;
  if (local) {
    try {
      sha = git(["rev-parse", "refs/harness/local-tasks"], cwd);
    } catch {
      /* initial ledger */
    }
  } else {
    git(["remote", "get-url", "origin"], cwd);
    const line = git(["ls-remote", "--heads", "origin", REF], cwd);
    if (line) {
      git(["fetch", "--quiet", "origin", REF], cwd);
      sha = git(["rev-parse", "FETCH_HEAD"], cwd);
    }
  }
  const definitions = json(join(cwd, "docs/tasks.json"));
  const ledger = sha ? JSON.parse(git(["show", `${sha}:docs/tasks.json`], cwd)) : { tasks: [] };
  const merged = definitions.tasks.map((t) => {
    const current = ledger.tasks.find((s) => s.id === t.id);
    return current
      ? {
          ...t,
          status: current.status,
          owner: current.owner,
          branch: current.branch,
          claimed_at: current.claimed_at,
        }
      : t;
  });
  // A stale clone must never drop claims for tasks it has not pulled yet.
  merged.push(...ledger.tasks.filter((t) => !definitions.tasks.some((d) => d.id === t.id)));
  return { sha, data: { ...definitions, tasks: merged } };
}
function ledgerCommit(cwd, parent, data, message) {
  const temp = mkdtempSync(join(tmpdir(), "wedding-claim-"));
  try {
    const env = { ...process.env, GIT_INDEX_FILE: join(temp, "index") };
    git(["read-tree", parent ?? "HEAD"], cwd, { env });
    const blob = git(["hash-object", "-w", "--stdin"], cwd, {
      input: JSON.stringify(data, null, 2) + "\n",
    });
    git(["update-index", "--add", "--cacheinfo", `100644,${blob},docs/tasks.json`], cwd, { env });
    const tree = git(["write-tree"], cwd, { env });
    return git(["commit-tree", tree, "-p", parent ?? "HEAD", "-m", message], cwd);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}
export async function changeTask(cwd, action, id, local = false) {
  return lock(
    "tasks",
    async () => {
      const { sha, data } = readLedger(cwd, local);
      const index = data.tasks.findIndex((t) => t.id === id);
      if (index < 0) throw new Error(`Unknown task: ${id}`);
      const who = owner(cwd);
      const next = transitionTask(data.tasks[index], action, who, data.tasks);
      if (action === "done") {
        const result = JSON.parse(
          run("gh", ["pr", "view", next.branch, "--json", "state,mergedAt,headRefName"], { cwd }),
        );
        if (result.state !== "MERGED" || !result.mergedAt || result.headRefName !== next.branch)
          throw new Error("PR must be merged before completion.");
      }
      data.tasks[index] = next;
      const commit = ledgerCommit(cwd, sha, data, `chore(tasks): ${action} ${id} (${who})`);
      if (local)
        git(
          [
            "update-ref",
            "refs/harness/local-tasks",
            commit,
            sha ?? "0000000000000000000000000000000000000000",
          ],
          cwd,
        );
      else {
        // Compare-and-swap only this coordination ref; parent is always the observed SHA.
        // A concurrent writer makes the push fail instead of losing their claim.
        git(["push", `--force-with-lease=${REF}:${sha ?? ""}`, "origin", `${commit}:${REF}`], cwd);
      }
      return next;
    },
    cwd,
  );
}
async function main() {
  const [action, id] = process.argv.slice(2).filter((a) => a !== "--local");
  const local = process.argv.includes("--local");
  const cwd = root();
  if (action === "next" || action === "show") {
    const { data } = readLedger(cwd, local);
    const tasks = data.tasks.filter(
      (t) => !id || (action === "show" ? t.id === id : t.module === id),
    );
    const result =
      action === "show"
        ? tasks
        : tasks
            .filter(
              (t) =>
                t.status === "todo" &&
                !t.blocked_reason &&
                (t.dependsOn ?? []).every((d) =>
                  data.tasks.some((x) => x.id === d && x.status === "done"),
                ),
            )
            .slice(0, 1);
    console.log(JSON.stringify(result, null, 2));
  } else if (action === "sync") {
    const { data } = readLedger(cwd, local);
    // Explicit synchronization of metadata only, never stage unrelated work.
    const path = join(cwd, "docs/tasks.json");
    writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
  } else if (["claim", "release", "review"].includes(action)) {
    console.log(JSON.stringify(await changeTask(cwd, action, safeId(id), local), null, 2));
  } else
    throw new Error(
      "Usage: task.mjs next [module] | show [id] | claim/release/review <id> | sync [--local]",
    );
}
if (entry(import.meta.url)) cli(main);
