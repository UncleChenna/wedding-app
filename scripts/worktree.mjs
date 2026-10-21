#!/usr/bin/env node
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  realpathSync,
} from "node:fs";
import { createServer } from "node:net";
import { join, dirname } from "node:path";
import { branchName, isolatedConfig, safeId } from "./harness/core.mjs";
import { cli, common, git, json, lock, pnpm, root, writeJson } from "./harness/io.mjs";
import { worktreeBase } from "./harness/worktree-base.mjs";
import { liveTicket, ticketOwner } from "./harness/tickets.mjs";

function free(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)));
  });
}
async function main() {
  const [action, rawId] = process.argv.slice(2);
  const cwd = root();
  const primary = dirname(common(cwd));
  const stateFile = join(common(cwd), "harness-worktrees.json");
  if (action === "list") {
    console.log(git(["worktree", "list"], cwd));
    return;
  }
  if (action === "prune") {
    git(["worktree", "prune"], cwd);
    console.log("Pruned Git metadata. Use wt:remove to clean managed databases and reservations.");
    return;
  }
  const id = safeId(rawId);
  await lock(
    "worktrees",
    async () => {
      const state = existsSync(stateFile) ? json(stateFile) : {};
      const path = join(primary, ".worktrees", id);
      if (action === "remove") {
        if (!state[id]) {
          if (existsSync(path)) throw new Error("Unmanaged worktree: refusing removal.");
          console.log("Already removed.");
          return;
        }
        if (realpathSync(cwd) === realpathSync(path))
          throw new Error(
            "Run wt:remove from the primary checkout, not the worktree being removed.",
          );
        if (git(["status", "--porcelain"], path))
          throw new Error("Worktree has changes; commit or preserve them before removal.");
        if (git(["log", "--oneline", `${state[id].baseCommit}..HEAD`], path)) {
          git(["fetch", "origin", "develop"], path);
          git(["merge-base", "--is-ancestor", "HEAD", "FETCH_HEAD"], path);
        }
        pnpm(
          [
            "exec",
            "supabase",
            "stop",
            "--workdir",
            join(path, ".harness", "supabase-project"),
            "--no-backup",
          ],
          cwd,
        );
        git(["worktree", "remove", path], cwd);
        delete state[id];
        writeJson(stateFile, state);
        console.log(`Removed ${id} and its disposable Supabase data; branch retained.`);
        return;
      }
      if (action !== "new")
        throw new Error("Usage: worktree.sh new <ticket-id> | list | remove <ticket-id> | prune");
      if (!state[id]) {
        let task;
        if (id === "demo-task")
          task = { id, title: "demo", branch: branchName(ticketOwner(cwd), { id, title: "demo" }) };
        else {
          task = liveTicket(cwd, id);
          if (
            task.owner !== ticketOwner(cwd) ||
            !task.branch ||
            ["done", "cancelled"].includes(task.status)
          )
            throw new Error(
              `Claim this ticket first: pnpm t:claim ${id} --owner <you> --agent <agent>.`,
            );
        }
        if (existsSync(path))
          throw new Error("Path already exists and is not managed; refusing overwrite.");
        const seed = createHash("sha256").update(`${primary}:${id}`).digest().readUInt16BE(0);
        let base;
        for (let i = 0; i < 1000; i++) {
          const candidate = 20000 + ((seed + i) % 1000) * 20;
          if (Object.values(state).some((v) => v.portBase === candidate)) continue;
          if (
            (await Promise.all(Array.from({ length: 20 }, (_, n) => free(candidate + n)))).every(
              Boolean,
            )
          ) {
            base = candidate;
            break;
          }
        }
        if (!base) throw new Error("No free local port block; check port-binding permission.");
        const project = `wedding-${createHash("sha256").update(`${primary}:${id}`).digest("hex").slice(0, 12)}`;
        const { baseCommit, existingBranch } = worktreeBase(cwd, task.branch);
        mkdirSync(dirname(path), { recursive: true });
        git(
          existingBranch
            ? ["worktree", "add", path, task.branch]
            : ["worktree", "add", "-b", task.branch, path, baseCommit],
          cwd,
        );
        // A newly allocated ticket may not be on develop yet. Carry its definition only.
        if (
          task.path &&
          /^tickets\/TICKET-\d{3}-[a-z0-9-]+\.md$/.test(task.path) &&
          !existsSync(join(path, task.path))
        )
          copyFileSync(join(cwd, task.path), join(path, task.path));
        state[id] = {
          id,
          path,
          branch: task.branch,
          project,
          portBase: base,
          devPort: base + 10,
          pwPort: base + 11,
          baseCommit,
        };
        writeJson(stateFile, state); // Persist before setup; rerun new to resume failures.
      }
      const meta = state[id];
      const setup = join(path, ".harness", "supabase-project");
      mkdirSync(join(setup, "supabase"), { recursive: true });
      writeJson(join(path, ".harness", "worktree.json"), meta);
      writeFileSync(
        join(setup, "supabase", "config.toml"),
        isolatedConfig(
          readFileSync(join(path, "supabase/config.toml"), "utf8"),
          meta.project,
          meta.portBase,
        ),
      );
      if (!existsSync(join(path, ".env.local"))) {
        const source = existsSync(join(primary, ".env.local"))
          ? join(primary, ".env.local")
          : join(primary, ".env.example");
        copyFileSync(source, join(path, ".env.local")); // Never print credentials.
      }
      pnpm(["install", "--frozen-lockfile"], path);
      pnpm(["agents:link"], path);
      pnpm(["db:start"], path);
      pnpm(["db:migrate"], path);
      console.log(
        `Ready: ${path}\nBranch: ${meta.branch}\nApp: http://localhost:${meta.devPort}\nRun pnpm db:seed once if sample data is wanted.`,
      );
    },
    cwd,
  );
}
cli(main);
