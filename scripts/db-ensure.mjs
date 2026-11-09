#!/usr/bin/env node
/**
 * TICKET-218: starts this worktree's Supabase stack on first use. db:migrate, db:seed and db:reset
 * call it first, so `wt:new` no longer needs to start Docker for every ticket. Outside a managed
 * worktree (the primary checkout, CI) it does nothing: those use their configured database.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { cli, entry, pnpm, root, run } from "./harness/io.mjs";

/** Pure decision, for tests: start only in a managed worktree whose stack isn't running. */
export function needsStart({ managed, running }) {
  return managed && !running;
}

function stackRunning(cwd) {
  try {
    run(
      "pnpm",
      [
        "exec",
        "supabase",
        "status",
        "--workdir",
        join(cwd, ".harness/supabase-project"),
        "-o",
        "json",
      ],
      { cwd },
    );
    return true;
  } catch {
    return false;
  }
}

if (entry(import.meta.url))
  cli(async () => {
    const cwd = root();
    const managed = existsSync(join(cwd, ".harness/worktree.json"));
    if (!needsStart({ managed, running: managed && stackRunning(cwd) })) return;
    console.log("This worktree's database isn't running yet; starting it (first use)…");
    pnpm(["db:start"], cwd);
  });
