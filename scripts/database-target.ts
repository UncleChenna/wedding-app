import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { join } from "node:path";

import { z } from "zod";

const managedIdentity = z.object({
  path: z.string().min(1),
  project: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/),
  portBase: z.number().int().min(1024).max(65515),
});

/**
 * Check the effective URL before creating a database client. This is accidental-target
 * protection, not an authorization boundary: the local metadata is developer-controlled.
 * Primary checkouts and deployment archives may use their configured remote database.
 */
export function assertDatabaseTarget(
  databaseUrl: string,
  options: { cwd?: string; localOnly?: boolean } = {},
): void {
  try {
    const cwd = realpathSync(options.cwd ?? process.cwd());
    const url = new URL(databaseUrl);
    if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error();
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (options.localOnly && (!local || url.search || url.hash)) throw new Error();

    const metadataPath = join(cwd, ".harness/worktree.json");
    const gitPath = join(cwd, ".git");
    const linked = existsSync(gitPath) && statSync(gitPath).isFile();
    if (!existsSync(metadataPath)) {
      if (linked) throw new Error();
      return;
    }

    const identity = managedIdentity.parse(JSON.parse(readFileSync(metadataPath, "utf8")));
    if (realpathSync(identity.path) !== cwd) throw new Error();
    // Read the exact generated format owned by isolatedConfig, not arbitrary TOML input.
    const config = readFileSync(
      join(cwd, ".harness/supabase-project/supabase/config.toml"),
      "utf8",
    );
    const project = config.match(/^project_id\s*=\s*"([^"]+)"\s*$/m)?.[1];
    const dbSection = config.split(/^\[db\]\s*$/m)[1]?.split(/^\[/m)[0];
    const port = Number(dbSection?.match(/^port\s*=\s*(\d+)\s*$/m)?.[1]);
    if (project !== identity.project || port !== identity.portBase + 1) throw new Error();
    if (
      !local ||
      url.port !== String(port) ||
      url.pathname !== "/postgres" ||
      url.search ||
      url.hash
    )
      throw new Error();
  } catch {
    // Neither URL values nor parse errors may expose credentials.
    throw new Error(
      "Database target refused. Managed worktrees require their own local database. " +
        "Check .harness/worktree.json and effective DATABASE_URL; complete pnpm db:start " +
        "in this worktree and remove conflicting shell overrides before retrying. " +
        "Seeding is local-only.",
    );
  }
}
