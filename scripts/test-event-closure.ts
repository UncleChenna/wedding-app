import { randomBytes, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";

const email = `closure-${randomUUID()}@example.test`;
const result = spawnSync(
  "pnpm",
  ["exec", "playwright", "test", "e2e/event-closure.spec.ts", "--project=desktop", "--workers=1"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_EVENT_CLOSURE_JOURNEY: "1",
      ADMIN_TEST_EMAIL: email,
      ADMIN_EMAIL_ALLOWLIST: email,
      STAFF_SESSION_SECRET: randomBytes(32).toString("hex"),
    },
  },
);
process.exitCode = result.status ?? 1;
