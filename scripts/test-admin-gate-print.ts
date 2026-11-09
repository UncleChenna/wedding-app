import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
const prefix = `gate-print-${randomBytes(6).toString("hex")}`;
const result = spawnSync(
  "pnpm",
  [
    "exec",
    "playwright",
    "test",
    "e2e/admin-gate-print.spec.ts",
    "--project=desktop",
    "--workers=1",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_ADMIN_GATE_PRINT_TESTS: "1",
      ADMIN_GATE_PRINT_PREFIX: prefix,
      ADMIN_EMAIL_ALLOWLIST: `${prefix}-desktop@example.test`,
    },
  },
);
process.exitCode = result.status ?? 1;
