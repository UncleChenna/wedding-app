#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";
import { cli, git, json, pnpm, root, run } from "./harness/io.mjs";

cli(async () => {
  const action = process.argv[2];
  const cwd = root();
  const metaPath = join(cwd, ".harness/worktree.json");
  const isolated = existsSync(metaPath);
  const linked = git(["rev-parse", "--git-dir"], cwd) !== ".git";
  if (linked && !isolated)
    throw new Error(
      "Unmanaged worktree: create it with pnpm wt:new so it cannot share the primary database.",
    );
  const meta = isolated ? json(metaPath) : null;
  if (meta && meta.path !== cwd) throw new Error("Worktree identity mismatch.");
  const workdir = meta ? join(cwd, ".harness/supabase-project") : cwd;
  const args = ["exec", "supabase"];
  if (action === "stop") {
    pnpm([...args, "stop", "--workdir", workdir], cwd);
    return;
  }
  if (action === "status") {
    const status = JSON.parse(
      run("pnpm", [...args, "status", "--workdir", workdir, "-o", "json"], { cwd }),
    );
    console.log(
      JSON.stringify(
        {
          api: status.API_URL,
          studio: status.STUDIO_URL,
          databasePort: new URL(status.DB_URL).port,
        },
        null,
        2,
      ),
    );
    return;
  }
  if (!["start", "reset"].includes(action)) throw new Error("Use start, stop, status or reset.");
  if (action === "start") {
    console.log("Starting isolated local Supabase (credentials suppressed)...");
    try {
      run("pnpm", [...args, "start", "--workdir", workdir], { cwd, maxBuffer: 8 * 1024 * 1024 });
    } catch {
      throw new Error(
        "Supabase startup failed. Check Docker and the reserved ports; retry db:start. CLI credentials are suppressed.",
      );
    }
  }
  const status = JSON.parse(
    run("pnpm", [...args, "status", "--workdir", workdir, "-o", "json"], { cwd }),
  );
  const envPath = join(cwd, ".env.local");
  const text = readFileSync(existsSync(envPath) ? envPath : join(cwd, ".env.example"), "utf8");
  const vars = parseEnv(text);
  if (action === "reset") {
    const actual = new URL(process.env.DATABASE_URL ?? vars.DATABASE_URL);
    const expected = new URL(status.DB_URL);
    if (
      !["localhost", "127.0.0.1", "[::1]"].includes(actual.hostname) ||
      actual.port !== expected.port ||
      actual.pathname !== expected.pathname
    )
      throw new Error(
        "Reset refused: DATABASE_URL does not match this worktree's local Supabase database.",
      );
    pnpm([...args, "db", "reset", "--local", "--workdir", workdir], cwd);
    pnpm(["db:migrate"], cwd);
    pnpm(["db:seed"], cwd);
    return;
  }
  if (!existsSync(envPath) || isolated) {
    const replacements = {
      DATABASE_URL: status.DB_URL,
      NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY ?? status.ANON_KEY,
      NEXT_PUBLIC_SITE_URL: `http://localhost:${meta?.devPort ?? 3000}`,
    };
    let output = text;
    for (const [key, value] of Object.entries(replacements)) {
      if (!value) throw new Error(`Supabase status did not provide ${key}.`);
      const re = new RegExp(`^${key}=.*$`, "m");
      output = re.test(output)
        ? output.replace(re, `${key}=${value}`)
        : `${output}\n${key}=${value}\n`;
    }
    writeFileSync(envPath, output, { mode: 0o600 });
  }
  console.log("Local database ready; credentials kept in .env.local.");
});
