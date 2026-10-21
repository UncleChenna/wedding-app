#!/usr/bin/env node
/**
 * Start the local Supabase stack, then make sure .env.local exists and points
 * at it. Safe to run repeatedly; never overwrites an existing .env.local.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const start = spawnSync("pnpm", ["exec", "supabase", "start"], {
  stdio: "inherit",
});
if (start.status !== 0) {
  console.error("\n✖ supabase start failed. Is Docker running?");
  process.exit(start.status ?? 1);
}

if (existsSync(".env.local")) {
  console.log("✔ .env.local already exists (left unchanged).");
  process.exit(0);
}

copyFileSync(".env.example", ".env.local");
try {
  const status = JSON.parse(
    execFileSync("pnpm", ["exec", "supabase", "status", "-o", "json"], {
      encoding: "utf8",
    }),
  );
  const replacements = {
    DATABASE_URL: status.DB_URL,
    NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY,
  };
  let env = readFileSync(".env.local", "utf8");
  for (const [key, value] of Object.entries(replacements)) {
    if (value) env = env.replace(new RegExp(`^${key}=.*$`, "m"), `${key}=${value}`);
  }
  writeFileSync(".env.local", env);
  console.log("✔ Created .env.local from .env.example with local Supabase values.");
} catch {
  console.log("✔ Created .env.local from .env.example (defaults).");
}
