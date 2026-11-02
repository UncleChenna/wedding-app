import { generateKeyPairSync } from "node:crypto";
import { spawnSync } from "node:child_process";
// Isolated review only. Keys exist only in this process and its local test server.
const missingKeys = process.argv.includes("--missing-keys");
const pair = generateKeyPairSync("ed25519");
const result = spawnSync(
  "pnpm",
  [
    "exec",
    "playwright",
    "test",
    "e2e/invitation-pass.spec.ts",
    "e2e/rsvp-live.spec.ts",
    "--project=mobile",
    "--workers=1",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_PASS_BROWSER_TESTS: "1",
      RUN_RSVP_BROWSER_TESTS: "1",
      RUN_PASS_MISSING_KEYS: missingKeys ? "1" : "0",
      GATE_SIGNING_KEY_ID: missingKeys ? "" : "review-044",
      GATE_SIGNING_PRIVATE_KEY: missingKeys
        ? ""
        : pair.privateKey.export({ format: "der", type: "pkcs8" }).toString("base64url"),
    },
  },
);
process.exitCode = result.status ?? 1;
