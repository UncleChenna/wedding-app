import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import { admitVerifiedPass } from "../../src/modules/checkin/server/online-admission";

describe.runIf(process.env.RUN_ONLINE_ADMISSION_DB_TESTS === "1")(
  "online admission transactions",
  () => {
    let client: Sql, db: Db;
    beforeAll(() => {
      process.loadEnvFile(".env.local");
      const url = process.env.DATABASE_URL ?? "";
      assertDatabaseTarget(url, { localOnly: true });
      client = postgres(url, {
        max: 5,
        prepare: false,
        connection: { application_name: "TICKET-061-admission-tests" },
      });
      db = drizzle(client, { schema });
    });
    afterAll(async () => {
      if (client) await client.end();
    });
    async function party() {
      const invitationId = randomUUID(),
        staffId = randomUUID(),
        deviceId = randomUUID();
      await db
        .insert(schema.staff)
        .values({ id: staffId, name: "Synthetic admission gate", role: "gate" });
      await db
        .insert(schema.registeredDevices)
        .values({ id: deviceId, name: "Synthetic admission scanner", role: "gate" });
      await db.insert(schema.invitations).values({ id: invitationId, status: "rsvp_yes" });
      await db
        .insert(schema.guests)
        .values({ invitationId, name: "Synthetic household", isPrimary: true });
      await db.insert(schema.rsvps).values({ invitationId, attending: true, countAttending: 4 });
      return {
        actor: { staffId, deviceId, credentialVersion: 1 },
        intent: { clientEventId: randomUUID(), invitationId, passVersion: 1, people: 2 },
      };
    }
    const events = (invitationId: string) =>
      db.select().from(schema.scanEvents).where(eq(schema.scanEvents.invitationId, invitationId));
    const counter = async (invitationId: string) =>
      (
        await db
          .select()
          .from(schema.admissionCounters)
          .where(eq(schema.admissionCounters.invitationId, invitationId))
      )[0]?.admittedPeople ?? 0;

    it("admits2of4 once, preserves the exact retry receipt and refuses changed replay intent", async () => {
      const { actor, intent } = await party();
      const first = await admitVerifiedPass(db, actor, intent, async () => true);
      expect(first).toMatchObject({
        state: "recorded",
        people: 2,
        admittedSoFar: 2,
        remaining: 2,
        name: "Synthetic household",
      });
      const duplicate = await admitVerifiedPass(db, actor, intent, async () => true);
      expect(duplicate).toMatchObject({ state: "duplicate", people: 2 });
      if (first.state !== "recorded" || duplicate.state !== "duplicate")
        throw new Error("Missing committed receipt");
      expect(duplicate.recordedAt).toBe(first.recordedAt);
      expect(
        await admitVerifiedPass(db, actor, { ...intent, people: 1 }, async () => true),
      ).toEqual({ state: "conflict" });
      expect(await counter(intent.invitationId)).toBe(2);
      expect(await events(intent.invitationId)).toHaveLength(1);
    });
    it("serializes concurrent retries of one id without duplicate events or counter increments", async () => {
      const { actor, intent } = await party();
      const outcomes = await Promise.all([
        admitVerifiedPass(db, actor, intent, async () => true),
        admitVerifiedPass(db, actor, intent, async () => true),
      ]);
      expect(outcomes.map((x) => x.state).sort()).toEqual(["duplicate", "recorded"]);
      expect(await counter(intent.invitationId)).toBe(2);
      expect(await events(intent.invitationId)).toHaveLength(1);
    });
    it("lets competing scanners admit only the current remaining allowance", async () => {
      const { actor, intent } = await party();
      const other = await party();
      const outcomes = await Promise.all([
        admitVerifiedPass(db, actor, { ...intent, people: 3 }, async () => true),
        admitVerifiedPass(
          db,
          other.actor,
          { ...intent, clientEventId: randomUUID(), people: 3 },
          async () => true,
        ),
      ]);
      expect(outcomes.map((x) => x.state).sort()).toEqual(["recorded", "too_many"]);
      expect(outcomes.find((x) => x.state === "too_many")).toEqual({
        state: "too_many",
        remaining: 1,
      });
      expect(await counter(intent.invitationId)).toBe(3);
      expect(await events(intent.invitationId)).toHaveLength(1);
    });
    it("refuses oversized counts, replaced credentials and revoked staff without recording admission", async () => {
      const { actor, intent } = await party();
      expect(
        await admitVerifiedPass(db, actor, { ...intent, people: 5 }, async () => true),
      ).toEqual({ state: "too_many", remaining: 4 });
      await db
        .update(schema.invitations)
        .set({ tokenVersion: 2 })
        .where(eq(schema.invitations.id, intent.invitationId));
      expect(await admitVerifiedPass(db, actor, intent, async () => true)).toEqual({
        state: "revoked",
      });
      await db
        .update(schema.staff)
        .set({ revokedAt: new Date() })
        .where(eq(schema.staff.id, actor.staffId));
      expect(await admitVerifiedPass(db, actor, intent, async () => true)).toEqual({
        state: "session_expired",
      });
      expect(await counter(intent.invitationId)).toBe(0);
      expect(await events(intent.invitationId)).toHaveLength(0);
    });
    it("rechecks session authorization after actually waiting for the invitation lock", async () => {
      const { actor, intent } = await party();
      const locked = Promise.withResolvers<void>(),
        release = Promise.withResolvers<void>();
      let authorized = true;
      const holder = db.transaction(async (tx) => {
        await tx
          .select({ id: schema.invitations.id })
          .from(schema.invitations)
          .where(eq(schema.invitations.id, intent.invitationId))
          .for("update");
        locked.resolve();
        await release.promise;
      });
      void holder.catch(locked.reject);
      await locked.promise;
      const attempt = admitVerifiedPass(db, actor, intent, async () => authorized);
      try {
        await expect
          .poll(async () => {
            const rows = await db.execute(
              sql`select count(*)::int as waiting from pg_stat_activity where application_name='TICKET-061-admission-tests' and wait_event_type='Lock'`,
            );
            return Number(rows[0]?.waiting ?? 0);
          })
          .toBeGreaterThan(0);
        authorized = false;
        release.resolve();
        await holder;
        expect(await attempt).toEqual({ state: "session_expired" });
        expect(await events(intent.invitationId)).toHaveLength(0);
      } finally {
        release.resolve();
        await Promise.allSettled([holder, attempt]);
      }
    });
  },
);
