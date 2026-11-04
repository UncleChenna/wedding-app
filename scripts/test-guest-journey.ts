import { generateKeyPairSync } from "node:crypto";
import { spawnSync } from "node:child_process";

// Ephemeral keys exist only in this process tree, never in files or CI secrets.
const pair = generateKeyPairSync("ed25519");
const result = spawnSync(
  "pnpm",
  [
    "exec",
    "playwright",
    "test",
    "e2e/guest.spec.ts",
    "--project=mobile",
    "--project=desktop",
    "--workers=1",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_GUEST_JOURNEY: "1",
      GATE_SIGNING_KEY_ID: "test-131",
      GATE_SIGNING_PRIVATE_KEY: pair.privateKey
        .export({ format: "der", type: "pkcs8" })
        .toString("base64url"),
    },
  },
);
process.exitCode = result.status ?? 1;
