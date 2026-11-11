import { generateKeyPairSync, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
const keys = generateKeyPairSync("ed25519");
const result = spawnSync(
  "pnpm",
  [
    "exec",
    "playwright",
    "test",
    "e2e/scanner-updates.spec.ts",
    "--project=mobile",
    "--project=desktop",
    "--workers=1",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_SCANNER_UPDATES: "1",
      STAFF_SESSION_SECRET: randomBytes(32).toString("hex"),
      GATE_SIGNING_KEY_ID: "scanner-updates-test",
      GATE_SIGNING_PRIVATE_KEY: keys.privateKey
        .export({ type: "pkcs8", format: "der" })
        .toString("base64url"),
    },
  },
);
process.exitCode = result.status ?? 1;
