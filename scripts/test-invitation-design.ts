import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { assertAdminJourneyTarget } from "./admin-journey-ci";

const env: NodeJS.ProcessEnv = { ...parseEnv(readFileSync(".env.local", "utf8")), ...process.env };
const meta = assertAdminJourneyTarget(process.cwd(), env);
const email = `design-${randomBytes(8).toString("hex")}@example.test`;
Object.assign(env, {
  RUN_INVITATION_DESIGN_E2E: "1",
  ADMIN_TEST_EMAIL: email,
  ADMIN_EMAIL_ALLOWLIST: email,
  NEXT_PUBLIC_SITE_URL: `http://localhost:${meta.pwPort}`,
});
// One fresh identity per run; select one project to avoid re-enrolling the same account.
const project = process.argv.includes("--desktop") ? "desktop" : "mobile";
for (const args of [
  ["db:migrate"],
  ...(process.argv.includes("--build") ? [["build"]] : []),
  [
    "exec",
    "playwright",
    "test",
    "e2e/admin-invitation-design.spec.ts",
    `--project=${project}`,
    "--workers=1",
  ],
]) {
  const result = spawnSync("pnpm", args, { env, stdio: "inherit" });
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    break;
  }
}
