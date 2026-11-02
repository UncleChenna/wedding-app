import { generateKeyPairSync } from "node:crypto";
import { spawnSync } from "node:child_process";
const pair = generateKeyPairSync("ed25519");
const result = spawnSync(
  "pnpm",
  ["exec", "playwright", "test", "e2e/invitation-pdf.spec.ts", "--project=mobile", "--workers=1"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_PDF_BROWSER_TESTS: "1",
      GATE_SIGNING_KEY_ID: "review-046",
      GATE_SIGNING_PRIVATE_KEY: pair.privateKey
        .export({ format: "der", type: "pkcs8" })
        .toString("base64url"),
    },
  },
);
process.exitCode = result.status ?? 1;
