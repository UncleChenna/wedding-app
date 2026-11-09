/**
 * Reset and seed the LOCAL database with deterministic fake data.
 * Usage: pnpm db:seed
 * Refuses to run against a non-local DATABASE_URL.
 */
import { existsSync } from "node:fs";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/modules/shared/server/db/schema";
import { parseServerEnv } from "../src/modules/shared/lib/env/schema";
import { createLogger } from "../src/modules/shared/lib/logger";
import { buildSeedData } from "./seed-data";
import { writeSeedData } from "./seed-store";
import { parseSeedProfile } from "./seed-profile";
import { assertDatabaseTarget } from "./database-target";

const log = createLogger({ script: "seed" }, { format: "pretty" });

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const env = parseServerEnv(process.env);

assertDatabaseTarget(env.DATABASE_URL, { localOnly: true });

const client = postgres(env.DATABASE_URL, { max: 1, onnotice: () => {} });
const db = drizzle(client, { schema });

async function main() {
  const profile = parseSeedProfile(process.argv.slice(2));
  const data = buildSeedData(20261021, profile);

  await db.transaction(async (tx) => {
    await writeSeedData(tx, data);
  });

  log.info("seeded local database", {
    profile,
    scanEvents: data.scanEvents.length,
    invitations: data.invitations.length,
    guests: data.guests.length,
    tables: data.tables.length,
    menuItems: data.menuItems.length,
    orders: data.orders.length,
    checkIns: data.checkIns.length,
  });
}

main()
  .catch((error: unknown) => {
    log.error("seed failed", { error });
    process.exitCode = 1;
  })
  .finally(() => client.end());
