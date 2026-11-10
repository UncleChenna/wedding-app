import { randomInt, randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import { readScanGuest } from "../../src/modules/checkin/server/scan-read-repository";

describe.runIf(process.env.RUN_SCAN_READ_DB_TESTS === "1")("authorized scanner projection", () => {
  let client: Sql;
  let db: Db;
  beforeAll(() => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    client = postgres(url, { max: 1, prepare: false });
    db = drizzle(client, { schema });
  });
  afterAll(async () => {
    if (client) await client.end();
  });

  it("reads current seating and canonical partial arrivals without private notes or recording admission", async () => {
    const rollback = new Error("rollback scanner synthetic fixtures");
    try {
      await db.transaction(async (tx) => {
        const invitationId = randomUUID(),
          tableId = randomUUID(),
          secondTableId = randomUUID();
        const staffId = randomUUID(),
          deviceId = randomUUID();
        const firstNumber = randomInt(100000, 200000),
          secondNumber = firstNumber + 1;
        await tx.insert(schema.tables).values([
          { id: tableId, number: firstNumber, capacity: 8 },
          { id: secondTableId, number: secondNumber, capacity: 8 },
        ]);
        await tx
          .insert(schema.invitations)
          .values({ id: invitationId, status: "rsvp_yes", tableId });
        await tx.insert(schema.guests).values({
          invitationId,
          name: "Synthetic primary",
          isPrimary: true,
          dietaryNotes: "PRIVATE DIETARY",
        });
        await tx
          .insert(schema.rsvps)
          .values({ invitationId, attending: true, countAttending: 4, message: "PRIVATE MESSAGE" });
        await tx.insert(schema.staff).values({ id: staffId, name: "Synthetic gate", role: "gate" });
        await tx
          .insert(schema.registeredDevices)
          .values({ id: deviceId, name: "Synthetic scanner", role: "gate" });
        const empty = await readScanGuest(tx, invitationId);
        expect(empty).toMatchObject({ admittedSoFar: 0, tableNumber: firstNumber, admissions: [] });
        for (const [people, minute] of [
          [2, 1],
          [1, 2],
        ] as const) {
          await tx.insert(schema.scanEvents).values({
            clientEventId: randomUUID(),
            invitationId,
            staffId,
            deviceId,
            reportedAt: new Date("2026-12-19T10:00:00Z"),
            receivedAt: new Date(`2026-12-19T10:0${minute}:00Z`),
            reportedResult: "valid",
            result: "valid",
            reportedPeople: people,
            admittedPeople: people,
            source: "online",
          });
        }
        await tx.insert(schema.scanEvents).values({
          clientEventId: randomUUID(),
          invitationId,
          staffId,
          deviceId,
          reportedAt: new Date(),
          reportedResult: "invalid",
          result: "invalid",
          reportedPeople: 0,
          admittedPeople: 0,
          source: "online",
        });
        await tx
          .update(schema.invitations)
          .set({ tableId: secondTableId })
          .where(eq(schema.invitations.id, invitationId));
        const before = await tx
          .select()
          .from(schema.scanEvents)
          .where(eq(schema.scanEvents.invitationId, invitationId));
        const result = await readScanGuest(tx, invitationId);
        expect(result).toMatchObject({
          tableNumber: secondNumber,
          admittedSoFar: 3,
          countAttending: 4,
          primaryNames: ["Synthetic primary"],
        });
        expect(result?.admissions).toEqual([
          {
            people: 2,
            timeLabel: "19 Dec 2026, 10:01 UTC (server receipt)",
            staffLabel: "Synthetic gate",
            deviceLabel: "Synthetic scanner",
          },
          {
            people: 1,
            timeLabel: "19 Dec 2026, 10:02 UTC (server receipt)",
            staffLabel: "Synthetic gate",
            deviceLabel: "Synthetic scanner",
          },
        ]);
        expect(JSON.stringify(result)).not.toMatch(/PRIVATE|dietary|message|pin|token"/i);
        expect(
          await tx
            .select()
            .from(schema.scanEvents)
            .where(eq(schema.scanEvents.invitationId, invitationId)),
        ).toEqual(before);
        expect(await readScanGuest(tx, randomUUID())).toBeNull();
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  });
});
