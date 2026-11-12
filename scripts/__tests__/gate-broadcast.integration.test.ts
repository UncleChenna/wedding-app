import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import { admitVerifiedPass } from "../../src/modules/checkin/server/online-admission";
import { reconcileScanBatch } from "../../src/modules/checkin/server/reconcile-scans";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
describe.runIf(process.env.RUN_REALTIME_DB_TESTS === "1")("gate transaction broadcasts", () => {
  let client: Sql, db: Db;
  beforeAll(async () => {
    if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    client = postgres(url, { max: 3, prepare: false });
    db = drizzle(client, { schema });
    const result = await db.execute(
      sql`select to_regprocedure('realtime.send(jsonb,text,text,boolean)') is not null as ready`,
    );
    expect(result[0]?.ready).toBe(true);
  });
  afterAll(async () => {
    if (client) await client.end();
  });
  async function party(tx: Tx) {
    const invitationId = randomUUID(),
      staffId = randomUUID(),
      deviceId = randomUUID();
    await tx.insert(schema.staff).values({ id: staffId, name: "Synthetic068 staff", role: "gate" });
    await tx
      .insert(schema.registeredDevices)
      .values({ id: deviceId, name: "Synthetic068 device", role: "gate" });
    await tx.insert(schema.invitations).values({ id: invitationId, status: "rsvp_yes" });
    await tx.insert(schema.guests).values({
      invitationId,
      name: "Private synthetic name",
      dietaryNotes: "Private synthetic allergy",
      isPrimary: true,
    });
    await tx.insert(schema.rsvps).values({ invitationId, attending: true, countAttending: 2 });
    return {
      actor: { staffId, deviceId, credentialVersion: 1 },
      intent: { clientEventId: randomUUID(), invitationId, passVersion: 1, people: 1 },
    };
  }
  async function messages(tx: Pick<Db, "execute">, invitationId: string) {
    return tx.execute(
      sql`select topic, event, private, payload from realtime.messages where payload->>'invitationId'=${invitationId}`,
    );
  }
  it("publishes only newly recorded online admissions, within the same rollback boundary", async () => {
    const rollback = new Error("synthetic rollback");
    let invitationId = "";
    await expect(
      db.transaction(async (tx) => {
        const fixture = await party(tx);
        invitationId = fixture.intent.invitationId;
        expect(
          (await admitVerifiedPass(tx, fixture.actor, fixture.intent, async () => true)).state,
        ).toBe("recorded");
        expect(
          (await admitVerifiedPass(tx, fixture.actor, fixture.intent, async () => true)).state,
        ).toBe("duplicate");
        expect(await messages(tx, invitationId)).toMatchObject([
          {
            topic: "station:gate",
            event: "checkin.recorded",
            private: true,
            payload: { invitationId, admitted: 1, conflict: false },
          },
        ]);
        expect(await messages(tx, invitationId)).toHaveLength(1);
        expect(JSON.stringify(await messages(tx, invitationId))).not.toContain("Private synthetic");
        throw rollback;
      }),
    ).rejects.toBe(rollback);
    expect(await messages(db, invitationId)).toHaveLength(0);
    expect(
      await db.select().from(schema.invitations).where(eq(schema.invitations.id, invitationId)),
    ).toHaveLength(0);
  });
  it("publishes new offline receipts but not replay; refusal cannot increase counters", async () => {
    const rollback = new Error("synthetic rollback");
    await expect(
      db.transaction(async (tx) => {
        const { actor, intent } = await party(tx);
        const report = {
          clientEventId: intent.clientEventId,
          invitationId: intent.invitationId,
          passVersion: 1,
          reportedAt: new Date().toISOString(),
          reportedResult: "valid" as const,
          reportedPeople: 2,
        };
        expect((await reconcileScanBatch(tx, actor, [report])).acks[0]?.status).toBe("recorded");
        expect((await reconcileScanBatch(tx, actor, [report])).acks[0]?.status).toBe("duplicate");
        const conflict = await reconcileScanBatch(tx, actor, [
          { ...report, clientEventId: randomUUID(), reportedPeople: 1 },
        ]);
        expect(conflict.acks[0]).toMatchObject({ status: "recorded", admitted: 0, conflict: true });
        const published = await messages(tx, intent.invitationId);
        expect(published).toHaveLength(2);
        expect(published).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              payload: expect.objectContaining({ admitted: 2, conflict: false }),
            }),
            expect.objectContaining({
              payload: expect.objectContaining({ admitted: 0, conflict: true }),
            }),
          ]),
        );
        throw rollback;
      }),
    ).rejects.toBe(rollback);
  });
});
