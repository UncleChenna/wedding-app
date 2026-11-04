import { existsSync } from "node:fs";
import { assertDatabaseTarget } from "./database-target";
import { parseServerEnv } from "../src/modules/shared/lib/env/schema";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const env = parseServerEnv(process.env);
assertDatabaseTarget(env.DATABASE_URL);
const flags = new Set(process.argv.slice(2));
if ([...flags].some((flag) => !["--upgrade-legacy", "--allow-legacy-token-reissue"].includes(flag)))
  throw new Error("Use --upgrade-legacy and, only after review, --allow-legacy-token-reissue.");
// Target validation intentionally precedes loading the migration graph.
async function main() {
  const [{ default: postgres }, { runSafeMigrations, SafeMigrationError }] = await Promise.all([
    import("postgres"),
    import("./safe-migrate"),
  ]);
  const client = postgres(env.DATABASE_URL, { max: 1, onnotice: () => {} });
  try {
    const result = await runSafeMigrations(client, {
      migrationsFolder: "drizzle",
      upgradeLegacy: flags.has("--upgrade-legacy"),
      allowLegacyTokenReissue: flags.has("--allow-legacy-token-reissue"),
    });
    console.log(JSON.stringify({ migrations: "applied", ...result }));
  } catch (error) {
    console.error(
      error instanceof SafeMigrationError
        ? error.message
        : "Migration failed; transaction rolled back. Inspect the isolated reproduction without logging guest data or credentials.",
    );
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}
main().catch(() => {
  console.error(
    "Migration setup or shutdown failed; inspect the isolated reproduction without logging credentials.",
  );
  process.exitCode = 1;
});
