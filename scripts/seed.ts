/**
 * Reset and seed the LOCAL database with deterministic fake data.
 * Usage: pnpm db:seed
 * Refuses to run against a non-local DATABASE_URL.
 */
import { existsSync } from "node:fs";

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/modules/shared/server/db/schema";
import { parseServerEnv } from "../src/modules/shared/lib/env/schema";
import { createLogger } from "../src/modules/shared/lib/logger";
import { buildSeedData } from "./seed-data";

const log = createLogger({ script: "seed" }, { format: "pretty" });

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const env = parseServerEnv(process.env);

const host = new URL(env.DATABASE_URL).hostname;
if (!["127.0.0.1", "localhost", "::1"].includes(host)) {
  log.error("refusing to seed a non-local database", { host });
  process.exit(1);
}

const client = postgres(env.DATABASE_URL, { max: 1, onnotice: () => {} });
const db = drizzle(client, { schema });

async function main() {
  const data = buildSeedData();

  await db.transaction(async (tx) => {
    await tx.execute(sql`
      truncate table order_items, station_orders, orders, menu_items, check_ins, rsvps, guests,
        tables, invitations, staff, themes restart identity cascade
    `);
    await tx.insert(schema.themes).values(data.themes);
    await tx.insert(schema.staff).values(data.staff);
    await tx.insert(schema.tables).values(data.tables);
    await tx.insert(schema.invitations).values(data.invitations);
    await tx.insert(schema.guests).values(data.guests);
    await tx.insert(schema.rsvps).values(data.rsvps);
    await tx.insert(schema.checkIns).values(data.checkIns);
    await tx.insert(schema.menuItems).values(data.menuItems);
    await tx.insert(schema.orders).values(data.orders);
    await tx.insert(schema.stationOrders).values(data.stationOrders);
    await tx.insert(schema.orderItems).values(data.orderItems);
  });

  log.info("seeded local database", {
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
