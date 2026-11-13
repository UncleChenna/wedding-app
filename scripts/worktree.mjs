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
import { isolatedConfig, safeId } from "./harness/core.mjs";
import { cli, common, git, json, lock, pnpm, root, writeJson } from "./harness/io.mjs";
import { copySupabaseTemplates } from "./harness/supabase-templates.mjs";
import { worktreeBase } from "./harness/worktree-base.mjs";

function free(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)));
  });
}
async function main() {
  const [action, rawId] = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
  const withDatabase = process.argv.includes("--db");
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
        throw new Error("Usage: worktree.sh new <name> | list | remove <name> | prune");
      if (!state[id]) {
        // The worktree's branch is named after it (a ticket id such as TICKET-123, or any slug).
        const task = { branch: id, path: "" };
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
      copySupabaseTemplates(path, setup);
      if (!existsSync(join(path, ".env.local"))) {
        const source = existsSync(join(primary, ".env.local"))
          ? join(primary, ".env.local")
          : join(primary, ".env.example");
        copyFileSync(source, join(path, ".env.local")); // Never print credentials.
      }
      pnpm(["install", "--frozen-lockfile"], path);
      // The database is on demand: db:migrate, db:seed and db:reset start this worktree's stack
      // the first time they need it; --db starts it now.
      if (withDatabase) {
        pnpm(["db:start"], path);
        pnpm(["db:migrate"], path);
      }
      console.log(
        `Ready: ${path}\nBranch: ${meta.branch}\nApp: http://localhost:${meta.devPort}\n` +
          (withDatabase
            ? "Run pnpm db:seed once if sample data is wanted."
            : "Database not started: pnpm db:migrate (or db:seed / db:start) starts it when you need it."),
      );
    },
    cwd,
  );
}
cli(main);
