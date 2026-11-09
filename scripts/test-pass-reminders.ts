import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
const prefix = `pass-reminder-${randomBytes(6).toString("hex")}`;
const result = spawnSync(
  "pnpm",
  [
    "exec",
    "playwright",
    "test",
    "e2e/admin-pass-reminders.spec.ts",
    "--project=mobile",
    "--project=desktop",
    "--workers=1",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_PASS_REMINDER_BROWSER_TESTS: "1",
      PASS_REMINDER_TEST_PREFIX: prefix,
      ADMIN_EMAIL_ALLOWLIST: `${prefix}-mobile@example.test,${prefix}-desktop@example.test`,
    },
  },
);
process.exitCode = result.status ?? 1;
