import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import {
  prepareAdminJourneyCi,
  journeyEnvironment,
  assertAdminJourneyTarget,
} from "./admin-journey-ci";

function run(args: string[], env: NodeJS.ProcessEnv) {
  const result = spawnSync("pnpm", args, { stdio: "inherit", env });
  if (result.status !== 0)
    throw new Error(`Admin journey command failed: ${args[0]} (${result.status ?? "spawn error"})`);
}
try {
  const hosted = process.argv.includes("--ci");
  if (hosted) {
    prepareAdminJourneyCi(process.cwd(), process.env);
    run(["db:start"], process.env);
  }
  const env = journeyEnvironment(process.env, parseEnv(readFileSync(".env.local", "utf8")));
  const meta = assertAdminJourneyTarget(process.cwd(), env);
  const prefix = `journey-${randomBytes(6).toString("hex")}`;
  Object.assign(env, {
    RUN_ADMIN_JOURNEY: "1",
    ADMIN_JOURNEY_PREFIX: prefix,
    ADMIN_EMAIL_ALLOWLIST: ["mobile", "desktop"]
      .flatMap((project) => [
        `${prefix}-${project}@example.test`,
        `${prefix}-counters-${project}@example.test`,
      ])
      .join(","),
    STAFF_SESSION_SECRET: randomBytes(32).toString("hex"),
    NEXT_PUBLIC_SITE_URL: `http://localhost:${meta.pwPort}`,
  });
  run(["db:migrate"], env);
  run(
    ["exec", "vitest", "run", "scripts/__tests__/dashboard.integration.test.ts", "--maxWorkers=1"],
    {
      ...env,
      RUN_DASHBOARD_DB_TESTS: "1",
    },
  );
  if (hosted || process.argv.includes("--build")) run(["build"], env);
  run(
    [
      "exec",
      "playwright",
      "test",
      "e2e/admin.spec.ts",
      "e2e/admin-dashboard.spec.ts",
      "--project=mobile",
      "--project=desktop",
      "--workers=1",
    ],
    env,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : "Admin journey failed");
  process.exitCode = 1;
}
