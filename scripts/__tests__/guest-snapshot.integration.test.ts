import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import { readGuestSnapshotRows } from "../../src/modules/checkin/server/guest-snapshot-repository";
import * as schema from "../../src/modules/shared/server/db/schema";

describe.runIf(process.env.RUN_GUEST_SNAPSHOT_DB_TESTS === "1")(
  "minimal scanner projection",
  () => {
    let connection: ReturnType<typeof postgres>;
    beforeAll(() => {
      if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
      const url = process.env.DATABASE_URL ?? "";
      assertDatabaseTarget(url, { localOnly: true });
      connection = postgres(url, { max: 1, prepare: false });
    });
    afterAll(async () => {
      await connection?.end({ timeout: 1 });
    });
    it("keeps named household state while excluding contacts, notes and bearer tokens", async () => {
      const id = randomUUID();
      const database = drizzle(connection, { schema });
      const rollback = new Error("synthetic snapshot rollback");
      try {
        await database.transaction(async (tx) => {
          await tx.insert(schema.invitations).values({
            id,
            token: randomUUID(),
            householdName: "Synthetic snapshot household",
            status: "rsvp_yes",
            notes: "private household notes",
          });
          await tx.insert(schema.guests).values({
            invitationId: id,
            name: "Synthetic snapshot guest",
            isPrimary: true,
            email: "private@example.test",
            dietaryNotes: "private dietary note",
          });
          await tx
            .insert(schema.rsvps)
            .values({ invitationId: id, attending: true, countAttending: 2 });
          const rows = await readGuestSnapshotRows(tx);
          const row = rows.find((row) => row.invitationId === id);
          expect(row).toEqual({
            invitationId: id,
            tokenVersion: 1,
            status: "rsvp_yes",
            attending: true,
            partySize: 2,
            admittedSoFar: 0,
            name: "Synthetic snapshot guest",
            names: ["Synthetic snapshot guest"],
            tableNumber: null,
          });
          expect(JSON.stringify(row)).not.toContain("private@example");
          await tx.insert(schema.guests).values([
            { invitationId: id, name: "A".repeat(200), isPrimary: true },
            { invitationId: id, name: "B".repeat(200), isPrimary: true },
            { invitationId: id, name: "C".repeat(200), isPrimary: true },
          ]);
          const large = (await readGuestSnapshotRows(tx)).find(
            (value) => value.invitationId === id,
          );
          expect(large?.name.length).toBeLessThanOrEqual(512);
          expect(large?.name).toContain(" & household");
          expect(large?.names).toHaveLength(4);
          const staffId = randomUUID(),
            deviceId = randomUUID();
          await tx
            .insert(schema.staff)
            .values({ id: staffId, name: "Synthetic gate operator", role: "gate" });
          await tx.insert(schema.registeredDevices).values({
            id: deviceId,
            name: "Synthetic scanner",
            role: "gate",
            registeredByStaffId: staffId,
          });
          await tx.insert(schema.scanEvents).values({
            clientEventId: randomUUID(),
            invitationId: id,
            staffId,
            deviceId,
            reportedAt: new Date(),
            reportedResult: "valid",
            result: "valid",
            reportedPeople: 1,
            admittedPeople: 1,
            source: "online",
          });
          await tx
            .update(schema.invitations)
            .set({ status: "revoked" })
            .where(eq(schema.invitations.id, id));
          const revoked = (await readGuestSnapshotRows(tx)).find((row) => row.invitationId === id);
          expect(revoked).toMatchObject({ status: "revoked", partySize: 2, admittedSoFar: 1 });
          throw rollback;
        });
      } catch (error) {
        if (error !== rollback) throw error;
      }
    });
  },
);
