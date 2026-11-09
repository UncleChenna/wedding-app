import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import { recordScanObservation } from "../../src/modules/checkin/server/scan-observation";
import { readScanGuest } from "../../src/modules/checkin/server/scan-read-repository";
import { admitVerifiedPass } from "../../src/modules/checkin/server/online-admission";

describe.runIf(process.env.RUN_SCAN_OBSERVATION_DB_TESTS === "1")(
  "private scan observations",
  () => {
    let client: Sql, db: Db;
    beforeAll(async () => {
      if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
      const url = process.env.DATABASE_URL ?? "";
      assertDatabaseTarget(url, { localOnly: true });
      client = postgres(url, { max: 5, prepare: false });
      db = drizzle(client, { schema });
      // Disposable guarded database only: grant SELECT so empty reads prove RLS, not missing privileges.
      await client`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
    END $$`;
      await client`GRANT USAGE ON SCHEMA public TO anon, authenticated`;
      await client`GRANT SELECT ON scan_events TO anon, authenticated`;
    });
    afterAll(async () => {
      if (client) await client.end();
    });
    async function fixture() {
      const staffId = randomUUID(),
        deviceId = randomUUID(),
        invitationId = randomUUID();
      await db
        .insert(schema.staff)
        .values({ id: staffId, name: "Synthetic observation staff", role: "gate" });
      await db
        .insert(schema.registeredDevices)
        .values({ id: deviceId, name: "Synthetic observation device", role: "gate" });
      await db.insert(schema.invitations).values({ id: invitationId, status: "rsvp_yes" });
      await db.insert(schema.guests).values({
        invitationId,
        name: "Synthetic household",
        isPrimary: true,
        dietaryNotes: "private diet marker",
      });
      await db.insert(schema.rsvps).values({ invitationId, attending: true, countAttending: 4 });
      return { actor: { staffId, deviceId, credentialVersion: 1 }, invitationId };
    }
    it("records five results, unknown FK and manual provenance without admitting anyone or leaking private data", async () => {
      const { actor, invitationId } = await fixture();
      const reportedAt = new Date(Date.now() - 1000);
      for (const result of ["valid", "already_used", "invalid", "revoked", "not_rsvped"] as const) {
        expect(
          await recordScanObservation(
            db,
            actor,
            {
              invitationId: result === "invalid" ? null : invitationId,
              result,
              reportedAt,
              inputMethod: result === "not_rsvped" ? "manual" : "qr",
            },
            async () => true,
          ),
        ).toBe(true);
      }
      const rows = await db
        .select()
        .from(schema.scanEvents)
        .where(eq(schema.scanEvents.staffId, actor.staffId));
      expect(rows).toHaveLength(5);
      expect(rows.map((row) => row.result).sort()).toEqual([
        "already_used",
        "invalid",
        "not_rsvped",
        "revoked",
        "valid",
      ]);
      for (const row of rows) {
        expect(row).toMatchObject({
          staffId: actor.staffId,
          deviceId: actor.deviceId,
          source: "online",
          reportedPeople: 0,
          admittedPeople: 0,
          reportedAt,
        });
        expect(row.receivedAt.getTime()).toBeGreaterThan(reportedAt.getTime());
        expect(Object.keys(row)).not.toContain("qr");
        expect(JSON.stringify(row)).not.toContain("private diet marker");
      }
      expect(rows.find((row) => row.result === "invalid")?.invitationId).toBeNull();
      expect(rows.find((row) => row.result === "not_rsvped")?.inputMethod).toBe("manual");
      expect((await readScanGuest(db, invitationId))?.admissions).toEqual([]);
      expect((await readScanGuest(db, invitationId))?.admittedSoFar).toBe(0);
      const intent = { invitationId, passVersion: 1, clientEventId: randomUUID(), people: 2 };
      expect(await admitVerifiedPass(db, actor, intent, async () => true)).toMatchObject({
        state: "recorded",
        admittedSoFar: 2,
      });
      expect(await admitVerifiedPass(db, actor, intent, async () => true)).toMatchObject({
        state: "duplicate",
        people: 2,
      });
      expect((await readScanGuest(db, invitationId))?.admissions).toHaveLength(1);
      expect((await readScanGuest(db, invitationId))?.admittedSoFar).toBe(2);
    });
    it("refuses stale credentials, revoked devices and expired live sessions without a row", async () => {
      const { actor, invitationId } = await fixture();
      const observation = {
        invitationId,
        result: "valid" as const,
        inputMethod: "qr" as const,
        reportedAt: new Date(),
      };
      expect(
        await recordScanObservation(
          db,
          { ...actor, credentialVersion: 2 },
          observation,
          async () => true,
        ),
      ).toBe(false);
      expect(await recordScanObservation(db, actor, observation, async () => false)).toBe(false);
      await db
        .update(schema.registeredDevices)
        .set({ revokedAt: new Date() })
        .where(eq(schema.registeredDevices.id, actor.deviceId));
      expect(await recordScanObservation(db, actor, observation, async () => true)).toBe(false);
      expect(
        await db
          .select()
          .from(schema.scanEvents)
          .where(eq(schema.scanEvents.staffId, actor.staffId)),
      ).toHaveLength(0);
    });
    it("preserves append-only guards and denies browser roles any scan log rows", async () => {
      const { actor, invitationId } = await fixture();
      await recordScanObservation(
        db,
        actor,
        { invitationId, result: "invalid", inputMethod: "qr", reportedAt: new Date() },
        async () => true,
      );
      await expect(
        db
          .update(schema.scanEvents)
          .set({ inputMethod: "manual" })
          .where(eq(schema.scanEvents.staffId, actor.staffId)),
      ).rejects.toThrow();
      for (const role of ["anon", "authenticated"] as const) {
        await db.transaction(async (tx) => {
          await tx.execute(sql.raw(`SET LOCAL ROLE ${role}`));
          expect(await tx.select().from(schema.scanEvents)).toEqual([]);
        });
      }
    });
  },
);
