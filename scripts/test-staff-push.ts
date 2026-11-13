import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { generateVAPIDKeys } from "web-push";

const keys = generateVAPIDKeys();
const result = spawnSync(
  "pnpm",
  [
    "exec",
    "playwright",
    "test",
    "e2e/staff-push.spec.ts",
    "--project=mobile",
    "--project=desktop",
    "--workers=1",
    // Chromium headless denies the real Notification API; Linux runners need Xvfb.
    "--headed",
    ...process.argv.slice(2),
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_STAFF_PUSH_JOURNEY: "1",
      STAFF_SESSION_SECRET: randomBytes(32).toString("hex"),
      WEB_PUSH_PUBLIC_KEY: keys.publicKey,
      WEB_PUSH_PRIVATE_KEY: keys.privateKey,
      WEB_PUSH_SUBJECT: "https://wedding.example",
    },
  },
);
process.exitCode = result.status ?? 1;
