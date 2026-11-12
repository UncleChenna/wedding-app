import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

/** PRD Journey 3 in browsers (TICKET-133), with a throwaway staff session secret. */
const result = spawnSync(
  "pnpm",
  ["exec", "playwright", "test", "e2e/ordering-journey.spec.ts", "--project=mobile", "--workers=1"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_ORDERING_JOURNEY: "1",
      STAFF_SESSION_SECRET: process.env.STAFF_SESSION_SECRET || randomBytes(32).toString("hex"),
    },
  },
);
process.exitCode = result.status ?? 1;
