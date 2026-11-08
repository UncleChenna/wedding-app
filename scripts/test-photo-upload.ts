import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

const prefix = `photo-${randomBytes(6).toString("hex")}`;
const result = spawnSync(
  "pnpm",
  [
    "exec",
    "playwright",
    "test",
    "e2e/admin-photo-upload.spec.ts",
    "--project=mobile",
    "--project=desktop",
    "--workers=1",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_PHOTO_JOURNEY: "1",
      PHOTO_TEST_PREFIX: prefix,
      ADMIN_EMAIL_ALLOWLIST: `${prefix}-mobile@example.test,${prefix}-desktop@example.test`,
    },
  },
);
process.exitCode = result.status ?? 1;
