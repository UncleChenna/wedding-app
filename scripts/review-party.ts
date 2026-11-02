import { generateKeyPairSync } from "node:crypto";
import { spawnSync } from "node:child_process";
// Disposable review keys never leave the local child processes.
const pair = generateKeyPairSync("ed25519");
const result = spawnSync(
  "pnpm",
  ["exec", "playwright", "test", "e2e/party.spec.ts", "--project=mobile", "--workers=1"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_PARTY_BROWSER_TESTS: "1",
      RUN_PARTY_SIGNED_PASS: "1",
      GATE_SIGNING_KEY_ID: "review-041",
      GATE_SIGNING_PRIVATE_KEY: pair.privateKey
        .export({ format: "der", type: "pkcs8" })
        .toString("base64url"),
    },
  },
);
process.exitCode = result.status ?? 1;
