import { generateKeyPairSync, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { assertAdminJourneyTarget, journeyEnvironment } from "./admin-journey-ci";
const env = journeyEnvironment(process.env, parseEnv(readFileSync(".env.local", "utf8")));
const meta = assertAdminJourneyTarget(process.cwd(), env);
const email = `staff-audit-${randomBytes(6).toString("hex")}@example.test`;
const keys = generateKeyPairSync("ed25519");
Object.assign(env, {
  RUN_ADMISSION_JOURNEY: "1",
  GATE_SIGNING_KEY_ID: "scan-test",
  GATE_SIGNING_PRIVATE_KEY: keys.privateKey
    .export({ format: "der", type: "pkcs8" })
    .toString("base64url"),
  GATE_SIGNING_PUBLIC_KEY: keys.publicKey
    .export({ format: "der", type: "spki" })
    .toString("base64url"),
  RUN_STAFF_ACCESSIBILITY: "1",
  ADMIN_TEST_EMAIL: email,
  ADMIN_EMAIL_ALLOWLIST: email,
  STAFF_SESSION_SECRET: randomBytes(32).toString("hex"),
  NEXT_PUBLIC_SITE_URL: `http://localhost:${meta.pwPort}`,
});
for (const args of [
  ["exec", "drizzle-kit", "migrate"],
  ...(process.argv.includes("--build") ? [["build"]] : []),
  [
    "exec",
    "playwright",
    "test",
    "e2e/staff-accessibility.spec.ts",
    "e2e/gate.spec.ts",
    "--project=mobile",
    "--workers=1",
    ...(process.argv.includes("--admin")
      ? ["--grep", "admin routes"]
      : process.argv.includes("--operational")
        ? ["--grep", "authenticated staff|camera pixels"]
        : ["--grep", "staff/admin accessibility|camera pixels"]),
  ],
]) {
  const result = spawnSync("pnpm", args, { env, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
