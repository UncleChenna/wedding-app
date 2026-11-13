import { generateKeyPairSync } from "node:crypto";
import { spawnSync } from "node:child_process";
const keys = generateKeyPairSync("ed25519");
const result = spawnSync(
  "pnpm",
  [
    "exec",
    "playwright",
    "test",
    "e2e/guest-accessibility.spec.ts",
    "--project=desktop",
    "--workers=1",
    ...process.argv.slice(2),
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_GUEST_ACCESSIBILITY: "1",
      GATE_SIGNING_KEY_ID: "test-117",
      GATE_SIGNING_PRIVATE_KEY: keys.privateKey
        .export({ format: "der", type: "pkcs8" })
        .toString("base64url"),
    },
  },
);
process.exitCode = result.status ?? 1;
