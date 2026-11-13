#!/usr/bin/env node
/** Full local check: format, lint, types, unit tests, production build. Stops at the first failure. */
import { spawnSync } from "node:child_process";

const steps = ["format:check", "lint", "typecheck", "test", "build"];
for (const step of steps) {
  console.log(`\n▶ ${step}`);
  const { status } = spawnSync("pnpm", ["-s", step], { stdio: "inherit" });
  if (status !== 0) {
    console.error(`\n✖ ${step} failed`);
    process.exit(1);
  }
}
console.log("\n✔ verify passed");
