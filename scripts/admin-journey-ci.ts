import { z } from "zod";
import { assertDatabaseTarget } from "./database-target";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { isolatedConfig } from "./harness/core.mjs";
import { copySupabaseTemplates } from "./harness/supabase-templates.mjs";

/** Only a fresh GitHub-hosted checkout may manufacture an isolated test identity. */
export function prepareAdminJourneyCi(cwd: string, env: Partial<NodeJS.ProcessEnv>) {
  const root = realpathSync(cwd);
  if (
    env.CI !== "true" ||
    env.GITHUB_ACTIONS !== "true" ||
    env.RUNNER_ENVIRONMENT !== "github-hosted" ||
    resolve(env.GITHUB_WORKSPACE ?? "/") !== root ||
    !/^\d+$/.test(env.GITHUB_RUN_ID ?? "") ||
    !/^\d+$/.test(env.GITHUB_RUN_ATTEMPT ?? "") ||
    !lstatSync(join(root, ".git"), { throwIfNoEntry: false })?.isDirectory() ||
    existsSync(join(root, ".harness")) ||
    existsSync(join(root, ".env.local"))
  ) {
    throw new Error(
      "Admin journey requires a fresh hosted CI checkout; existing local identity is never replaced.",
    );
  }
  const project = `wedding-admin-${env.GITHUB_RUN_ID}-${env.GITHUB_RUN_ATTEMPT}`;
  const setup = join(root, ".harness/supabase-project");
  const config = isolatedConfig(
    readFileSync(join(root, "supabase/config.toml"), "utf8"),
    project,
    28000,
  );
  copySupabaseTemplates(root, setup);
  mkdirSync(join(setup, "supabase"), { recursive: true });
  writeFileSync(join(setup, "supabase/config.toml"), config, { flag: "wx" });
  writeFileSync(
    join(root, ".harness/worktree.json"),
    JSON.stringify({
      id: "TICKET-134",
      path: root,
      branch: "TICKET-134",
      project,
      portBase: 28000,
      devPort: 28010,
      pwPort: 28011,
    }),
    { flag: "wx" },
  );
  writeFileSync(join(root, ".env.local"), readFileSync(join(root, ".env.example")), {
    flag: "wx",
    mode: 0o600,
  });
}

/** process.loadEnvFile deliberately preserves existing values; CI needs explicit override. */
export function journeyEnvironment(
  inherited: NodeJS.ProcessEnv,
  generated: Record<string, string | undefined>,
): NodeJS.ProcessEnv {
  return { ...inherited, ...generated };
}

/** Check both database and Auth targets before any fixture write, even for direct test runs. */
export function assertAdminJourneyTarget(cwd: string, env: Partial<NodeJS.ProcessEnv>) {
  const root = realpathSync(cwd);
  const identity = z
    .object({
      path: z.string(),
      portBase: z.number().int().min(1024).max(65515),
      pwPort: z.number().int(),
    })
    .parse(JSON.parse(readFileSync(join(root, ".harness/worktree.json"), "utf8")));
  assertDatabaseTarget(env.DATABASE_URL ?? "", { cwd: root, localOnly: true });
  const api = new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  if (
    identity.path !== root ||
    identity.pwPort !== identity.portBase + 11 ||
    api.protocol !== "http:" ||
    api.hostname !== "127.0.0.1" ||
    api.port !== String(identity.portBase) ||
    api.pathname !== "/" ||
    api.search ||
    api.hash ||
    api.username ||
    api.password
  )
    throw new Error("Admin journey Auth/checkout identity mismatch");
  return identity;
}
