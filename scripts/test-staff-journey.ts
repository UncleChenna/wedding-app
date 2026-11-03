import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

// Ephemeral signing material stays only in this process tree, never in files.
const result = spawnSync(
  "pnpm",
  [
    "exec",
    "playwright",
    "test",
    "e2e/staff-auth.spec.ts",
    "--project=mobile",
    "--project=desktop",
    "--workers=1",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_STAFF_JOURNEY: "1",
      STAFF_SESSION_SECRET: randomBytes(32).toString("hex"),
    },
  },
);
process.exitCode = result.status ?? 1;
