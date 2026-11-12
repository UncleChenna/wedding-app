import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

const result = spawnSync(
  "pnpm",
  ["exec", "playwright", "test", "e2e/order-delivery.spec.ts", "--project=mobile", "--workers=1"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_ORDER_DELIVERY_E2E: "1",
      STAFF_SESSION_SECRET: randomBytes(32).toString("hex"),
    },
  },
);
process.exitCode = result.status ?? 1;
