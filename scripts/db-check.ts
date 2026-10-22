/**
 * Database checks for the LOCAL (or CI) database.
 *
 *   pnpm db:check-rls   exit 1 if any public table lacks row-level security
 *   pnpm db:counts      print row counts per public table and applied migrations
 *
 * `db:counts` makes idempotency checkable: run it after each migrate/seed and diff.
 */
import { existsSync } from "node:fs";

import postgres from "postgres";

import { parseServerEnv } from "../src/modules/shared/lib/env/schema";
import { formatCounts, tablesMissingRls } from "./db-check-lib";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const env = parseServerEnv(process.env);
const client = postgres(env.DATABASE_URL, { max: 1, onnotice: () => {} });

async function rls(): Promise<number> {
  const rows = await client<{ table: string; rlsEnabled: boolean }[]>`
    select c.relname as "table", c.relrowsecurity as "rlsEnabled"
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
    order by c.relname`;
  const missing = tablesMissingRls(rows);
  if (missing.length) {
    console.error(`✖ Row-level security is disabled on: ${missing.join(", ")}`);
    return 1;
  }
  console.log(`✔ Row-level security enabled on all ${rows.length} public tables.`);
  return 0;
}

async function counts(): Promise<number> {
  const tables = await client<{ table: string }[]>`
    select tablename as "table" from pg_tables where schemaname = 'public' order by tablename`;
  const report: Record<string, number> = {};
  for (const { table } of tables) {
    const [row] = await client<{ n: number }[]>`select count(*)::int as n from ${client(table)}`;
    report[table] = row?.n ?? 0;
  }
  const [migrations] = await client<{ n: number }[]>`
    select count(*)::int as n from drizzle.__drizzle_migrations`;
  process.stdout.write(formatCounts({ tables: report, migrationsApplied: migrations?.n ?? 0 }));
  return 0;
}

const mode = process.argv[2];
const run = mode === "rls" ? rls : mode === "counts" ? counts : null;
if (!run) {
  console.error("Usage: tsx scripts/db-check.ts rls | counts");
  process.exit(2);
}
run()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error(`✖ ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(() => client.end());
