import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
const prefix = `export-${randomBytes(6).toString("hex")}`;
const result = spawnSync(
  "pnpm",
  [
    "exec",
    "playwright",
    "test",
    "e2e/admin-guest-export.spec.ts",
    "--project=mobile",
    "--project=desktop",
    "--workers=1",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_GUEST_EXPORT: "1",
      GUEST_EXPORT_PREFIX: prefix,
      ADMIN_EMAIL_ALLOWLIST: `${prefix}-mobile@example.test,${prefix}-desktop@example.test`,
    },
  },
);
process.exitCode = result.status ?? 1;
