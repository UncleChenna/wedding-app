import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
const prefix = `reminders-${randomBytes(6).toString("hex")}`;
const result = spawnSync(
  "pnpm",
  ["exec", "playwright", "test", "e2e/admin-reminders.spec.ts", "--project=desktop", "--workers=1"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_REMINDER_BROWSER_TESTS: "1",
      REMINDER_TEST_PREFIX: prefix,
      ADMIN_EMAIL_ALLOWLIST: `${prefix}-desktop@example.test`,
    },
  },
);
process.exitCode = result.status ?? 1;
