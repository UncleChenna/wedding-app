import { generateKeyPairSync } from "node:crypto";
import { spawnSync } from "node:child_process";
const pair = generateKeyPairSync("ed25519");
const result = spawnSync(
  "pnpm",
  [
    "exec",
    "playwright",
    "test",
    "e2e/lighthouse.spec.ts",
    "--project=mobile",
    "--workers=1",
    "--retries=0",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_LIGHTHOUSE_GATE: "1",
      GATE_SIGNING_KEY_ID: "test-116",
      GATE_SIGNING_PRIVATE_KEY: pair.privateKey
        .export({ format: "der", type: "pkcs8" })
        .toString("base64url"),
    },
  },
);
process.exitCode = result.status ?? 1;
