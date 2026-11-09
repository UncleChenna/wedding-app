import { randomInt, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import type * as Repository from "../../src/modules/admin/server/memories-repository";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
const rollback = new Error("rollback synthetic memories fixtures");

describe.runIf(process.env.RUN_MEMORIES_DB_TESTS === "1")("anonymous memories query", () => {
  let client: Sql;
  let database: Db;
  let readMemories: typeof Repository.readMemories;
  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    client = postgres(url, { max: 2, connect_timeout: 10, prepare: false, onnotice: () => {} });
    database = drizzle(client, { schema });
    ({ readMemories } = await import("../../src/modules/admin/server/memories-repository"));
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
  async function admitParties(tx: Tx, invitationId: string) {
    const staffId = randomUUID(),
      deviceId = randomUUID();
    await tx.insert(schema.staff).values({ id: staffId, name: "Synthetic gate", role: "gate" });
    await tx
      .insert(schema.registeredDevices)
      .values({ id: deviceId, name: "Synthetic scanner", role: "gate" });
    // Real scan guards update the canonical counter: two partial arrivals, three people.
    for (const people of [2, 1]) {
      await tx.insert(schema.scanEvents).values({
        clientEventId: randomUUID(),
        invitationId,
        staffId,
        deviceId,
        reportedAt: new Date(),
        reportedResult: "valid",
        result: "valid",
        reportedPeople: people,
        admittedPeople: people,
        source: "online",
      });
    }
  }
  async function migration(tx: Tx, namespace: string, tag: string) {
    const source = readFileSync(`drizzle/${tag}.sql`, "utf8")
      .replaceAll('"public".', `"${namespace}".`)
      .replaceAll("public.", `"${namespace}".`);
    await tx.execute(sql.raw(source));
  }

  it("counts partial online admissions without archive rows and excludes cancelled quantities and personal notes", async () => {
    await exercise(async (tx) => {
      const baseline = await readMemories(tx);
      const invitation = randomUUID(),
        table = randomUUID(),
        meal = randomUUID(),
        unused = randomUUID();
      const served = randomUUID(),
        cancelled = randomUUID(),
        servedStation = randomUUID(),
        cancelledStation = randomUUID();
      const menuName = `Memories fixture ${meal}`;
      await tx.insert(schema.invitations).values({ id: invitation, status: "rsvp_yes" });
      await tx.insert(schema.rsvps).values({
        invitationId: invitation,
        attending: true,
        countAttending: 5,
        message: "PRIVATE RSVP",
      });
      await tx.insert(schema.guests).values({
        invitationId: invitation,
        name: "PRIVATE NAME",
        email: "private@example.test",
        dietaryNotes: "PRIVATE DIET",
      });
      await admitParties(tx, invitation);
      await tx
        .insert(schema.tables)
        .values({ id: table, number: randomInt(100000, 2000000000), capacity: 10 });
      await tx.insert(schema.menuItems).values([
        { id: meal, name: menuName, category: "meal", station: "kitchen" },
        { id: unused, name: menuName + " unused", category: "meal", station: "kitchen" },
      ]);
      await tx.insert(schema.orders).values([
        { id: served, tableId: table, guestName: "PRIVATE NAME", notes: "PRIVATE ORDER" },
        { id: cancelled, tableId: table, guestName: "PRIVATE NAME", notes: "PRIVATE ORDER" },
      ]);
      await tx.insert(schema.stationOrders).values([
        { id: servedStation, orderId: served, station: "kitchen", status: "served" },
        { id: cancelledStation, orderId: cancelled, station: "kitchen", status: "cancelled" },
      ]);
      await tx.insert(schema.orderItems).values([
        {
          orderId: served,
          stationOrderId: servedStation,
          menuItemId: meal,
          quantity: 2,
          notes: "PRIVATE ITEM",
        },
        {
          orderId: cancelled,
          stationOrderId: cancelledStation,
          menuItemId: meal,
          quantity: 3,
          notes: "PRIVATE ITEM",
        },
      ]);
      const result = await readMemories(tx);
      expect(result.invitations).toBe(baseline.invitations + 1);
      expect(result.repliedYes).toBe(baseline.repliedYes + 1);
      expect(result.repliedNo).toBe(baseline.repliedNo);
      expect(result.attending).toBe(baseline.attending + 5);
      expect(result.admissions).toBe(baseline.admissions + 3);
      expect(result.menu.find((item) => item.name === menuName)).toEqual({
        name: menuName,
        ordered: 2,
        served: 2,
      });
      expect(result.menu.find((item) => item.name === menuName + " unused")).toEqual({
        name: menuName + " unused",
        ordered: 0,
        served: 0,
      });
      expect(JSON.stringify(result)).not.toMatch(/PRIVATE|private@example/);
    });
  });

  it("counts backfilled accepted people once, excludes legacy overflow, and adds new partial arrivals", async () => {
    await exercise(async (tx) => {
      const namespace = "memories_test_" + randomUUID().replaceAll("-", "");
      await tx.execute(sql.raw(`create schema "${namespace}"`));
      await tx.execute(sql.raw(`set local search_path to "${namespace}", pg_catalog`));
      const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8")) as {
        entries: { tag: string }[];
      };
      for (const entry of journal.entries.filter((entry) => Number(entry.tag.slice(0, 4)) <= 16)) {
        await migration(tx, namespace, entry.tag);
      }
      const legacy = randomUUID();
      await tx.insert(schema.invitations).values({ id: legacy, status: "rsvp_yes" });
      await tx
        .insert(schema.rsvps)
        .values({ invitationId: legacy, attending: true, countAttending: 1 });
      for (let index = 0; index < 2; index++) {
        const guest = randomUUID();
        await tx
          .insert(schema.guests)
          .values({ id: guest, invitationId: legacy, name: "Synthetic legacy guest" });
        await tx
          .insert(schema.checkIns)
          .values({ guestId: guest, clientEventId: randomUUID(), checkedInAt: new Date() });
      }
      await migration(tx, namespace, "0017_admission-backfill");
      await migration(tx, namespace, "0018_admission-guards");
      expect(await tx.select().from(schema.checkIns)).toHaveLength(2);
      expect((await readMemories(tx)).admissions).toBe(1);
      const current = randomUUID();
      await tx.insert(schema.invitations).values({ id: current, status: "rsvp_yes" });
      await tx
        .insert(schema.rsvps)
        .values({ invitationId: current, attending: true, countAttending: 4 });
      await admitParties(tx, current);
      expect((await readMemories(tx)).admissions).toBe(4);
      expect(await tx.select().from(schema.checkIns)).toHaveLength(2);
    });
  });
});
