import { generateKeyPairSync, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { journeyEnvironment, assertAdminJourneyTarget } from "./admin-journey-ci";
const env = journeyEnvironment(process.env, parseEnv(readFileSync(".env.local", "utf8")));
assertAdminJourneyTarget(process.cwd(), env);
const keys = generateKeyPairSync("ed25519");
const result = spawnSync(
  "pnpm",
  process.argv.includes("--db-only")
    ? [
        "exec",
        "vitest",
        "run",
        "scripts/__tests__/gate-broadcast.integration.test.ts",
        "--maxWorkers=1",
      ]
    : [
        "exec",
        "playwright",
        "test",
        ...(process.argv.includes("--conflicts-only") ? [] : ["e2e/scanner-updates.spec.ts"]),
        "e2e/gate-conflicts.spec.ts",
        "--project=mobile",
        "--project=desktop",
        "--workers=1",
      ],
  {
    stdio: "inherit",
    env: {
      ...env,
      RUN_REALTIME_DB_TESTS: "1",
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
