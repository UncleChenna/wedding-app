import { randomInt, randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import type { readDashboard as Reader } from "../../src/modules/admin/server/dashboard-reader";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
const rollback = new Error("rollback synthetic dashboard fixtures");

describe.runIf(process.env.RUN_DASHBOARD_DB_TESTS === "1")("live dashboard aggregate", () => {
  let client: Sql;
  let database: Db;
  let readDashboard: typeof Reader;
  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    client = postgres(url, { max: 2, connect_timeout: 10, prepare: false, onnotice: () => {} });
    database = drizzle(client, { schema });
    ({ readDashboard } = await import("../../src/modules/admin/server/dashboard-reader"));
  });
  afterAll(async () => {
    if (client) await client.end();
  });
  async function exercise(run: (tx: Tx) => Promise<void>) {
    try {
      await database.transaction(async (tx) => {
        await run(tx);
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  }

  it("counts active invitations, accepted people and canonical partial arrivals without personal data", async () => {
    await exercise(async (tx) => {
      const before = await readDashboard(tx);
      const accepted = randomUUID(),
        revoked = randomUUID();
      await tx
        .insert(schema.invitations)
        .values([
          { id: accepted, status: "rsvp_yes" },
          { id: revoked, status: "revoked" },
          { status: "sent" },
          { status: "rsvp_no" },
          { status: "draft" },
        ]);
      await tx.insert(schema.rsvps).values([
        { invitationId: accepted, attending: true, countAttending: 4, message: "PRIVATE" },
        { invitationId: revoked, attending: true, countAttending: 3 },
      ]);
      const staffId = randomUUID(),
        deviceId = randomUUID();
      await tx.insert(schema.staff).values({ id: staffId, name: "PRIVATE", role: "gate" });
      await tx
        .insert(schema.registeredDevices)
        .values({ id: deviceId, name: "Fixture", role: "gate" });
      for (const people of [2, 1])
        await tx.insert(schema.scanEvents).values({
          clientEventId: randomUUID(),
          invitationId: accepted,
          staffId,
          deviceId,
          reportedAt: new Date(),
          reportedResult: "valid",
          result: "valid",
          reportedPeople: people,
          admittedPeople: people,
          source: "online",
        });
      const result = await readDashboard(tx);
      expect(result).toEqual({
        ...before,
        invited: before.invited + 3,
        attending: before.attending + 4,
        arrived: before.arrived + 3,
      });
      expect(JSON.stringify(result)).not.toContain("PRIVATE");
    });
  });

  it("counts split orders once from station states and keeps childless legacy ready orders open", async () => {
    await exercise(async (tx) => {
      const before = await readDashboard(tx);
      const tableId = randomUUID();
      await tx
        .insert(schema.tables)
        .values({ id: tableId, number: randomInt(100000, 2000000000), capacity: 10 });
      const open = randomUUID(),
        served = randomUUID(),
        cancelled = randomUUID();
      await tx.insert(schema.orders).values([
        { id: open, tableId, status: "served" },
        { id: served, tableId, status: "received" },
        { id: cancelled, tableId, status: "received" },
        { tableId, status: "ready" },
        { tableId, status: "served" },
      ]);
      await tx.insert(schema.stationOrders).values([
        { orderId: open, station: "kitchen", status: "served" },
        { orderId: open, station: "bar", status: "preparing" },
        { orderId: served, station: "kitchen", status: "served" },
        { orderId: served, station: "bar", status: "cancelled" },
        { orderId: cancelled, station: "kitchen", status: "cancelled" },
      ]);
      expect(await readDashboard(tx)).toEqual({
        ...before,
        ordersOpen: before.ordersOpen + 2,
        ordersServed: before.ordersServed + 2,
      });
    });
  });
});
