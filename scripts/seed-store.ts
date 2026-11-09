import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../src/modules/shared/server/db/schema";
import { SEED_TIME, type SeedData } from "./seed-data";
import { resetSeedTables } from "./seed-reset";

type SeedTransaction = Parameters<
  Parameters<PostgresJsDatabase<typeof schema>["transaction"]>[0]
>[0];

/** Caller must validate the local database identity and own this disposable data. */
export async function writeSeedData(tx: SeedTransaction, data: SeedData) {
  await resetSeedTables((statement) => tx.execute(sql.raw(statement)));
  await tx.insert(schema.eventSettings).values(data.eventSettings);
  await tx.insert(schema.themes).values(data.themes);
  await tx.insert(schema.staff).values(data.staff);
  await tx.insert(schema.registeredDevices).values(data.registeredDevices);
  await tx.insert(schema.tables).values(data.tables);
  await tx.insert(schema.invitations).values(data.invitations);
  await tx.insert(schema.guests).values(data.guests);
  await tx.insert(schema.rsvps).values(data.rsvps);
  await tx.insert(schema.checkIns).values(data.checkIns);
  await tx.insert(schema.scanEvents).values(data.scanEvents);
  // Admission triggers use the clock; normalize only this synthetic seed transaction.
  await tx.update(schema.admissionCounters).set({ updatedAt: SEED_TIME });
  await tx.insert(schema.menuItems).values(data.menuItems);
  await tx.insert(schema.orders).values(data.orders);
  await tx.insert(schema.stationOrders).values(data.stationOrders);
  await tx.insert(schema.orderItems).values(data.orderItems);
}
