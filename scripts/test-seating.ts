import { generateKeyPairSync, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
const prefix = `seating-${randomBytes(6).toString("hex")}`;
const pair = generateKeyPairSync("ed25519");
const result = spawnSync(
  "pnpm",
  [
    "exec",
    "playwright",
    "test",
    "e2e/admin-seating.spec.ts",
    "--project=mobile",
    "--project=desktop",
    "--workers=1",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_SEATING_E2E: "1",
      SEATING_TEST_PREFIX: prefix,
      ADMIN_EMAIL_ALLOWLIST: `${prefix}-mobile@example.test,${prefix}-desktop@example.test`,
      GATE_SIGNING_KEY_ID: "seating-test",
      GATE_SIGNING_PRIVATE_KEY: pair.privateKey
        .export({ format: "der", type: "pkcs8" })
        .toString("base64url"),
    },
  },
);
process.exitCode = result.status ?? 1;
