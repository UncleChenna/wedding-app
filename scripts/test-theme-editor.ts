import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
const email = `theme-${randomBytes(6).toString("hex")}@example.test`;
const result = spawnSync(
  "pnpm",
  ["exec", "playwright", "test", "e2e/admin-themes.spec.ts", "--project=mobile", "--workers=1"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_THEME_EDITOR: "1",
      ADMIN_TEST_EMAIL: email,
      ADMIN_EMAIL_ALLOWLIST: email,
    },
  },
);
process.exitCode = result.status ?? 1;
