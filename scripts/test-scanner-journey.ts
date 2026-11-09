import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
const result = spawnSync(
  "pnpm",
  [
    "exec",
    "playwright",
    "test",
    "e2e/scanner.spec.ts",
    "--project=mobile",
    "--project=desktop",
    "--workers=1",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_SCANNER_JOURNEY: "1",
      STAFF_SESSION_SECRET: randomBytes(32).toString("hex"),
    },
  },
);
process.exitCode = result.status ?? 1;
