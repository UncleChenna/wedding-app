import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

const prefix = `guests-${randomBytes(6).toString("hex")}`;
const result = spawnSync(
  "pnpm",
  [
    "exec",
    "playwright",
    "test",
    "e2e/admin-guest-list.spec.ts",
    "--project=mobile",
    "--project=desktop",
    "--workers=1",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_ADMIN_GUEST_LIST_TESTS: "1",
      GUEST_LIST_TEST_PREFIX: prefix,
      ADMIN_EMAIL_ALLOWLIST: `${prefix}-mobile@example.test,${prefix}-desktop@example.test`,
    },
  },
);
process.exitCode = result.status ?? 1;
