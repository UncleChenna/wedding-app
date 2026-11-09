import { generateKeyPairSync, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
const pair = generateKeyPairSync("ed25519");
const result = spawnSync(
  "pnpm",
  [
    "exec",
    "playwright",
    "test",
    "e2e/scanner.spec.ts",
    "e2e/scan-results.spec.ts",
    "--project=mobile",
    "--project=desktop",
    "--workers=1",
    ...process.argv.slice(2),
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      STAFF_SESSION_SECRET: randomBytes(32).toString("hex"),
      RUN_SCANNER_JOURNEY: "1",
      RUN_SCAN_RESULTS_JOURNEY: "1",
      GATE_SIGNING_KEY_ID: "scan-test",
      GATE_SIGNING_PRIVATE_KEY: pair.privateKey
        .export({ format: "der", type: "pkcs8" })
        .toString("base64url"),
    },
  },
);
process.exitCode = result.status ?? 1;
