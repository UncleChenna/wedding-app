import { retireInvitationFixtures } from "../../e2e/support/invitation-fixtures";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, asc } from "drizzle-orm";
import postgres, { type Sql } from "postgres";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import type { saveRsvp } from "../../src/modules/invitations/server/save-rsvp";
import type { saveParty } from "../../src/modules/invitations/server/party";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
const rollback = new Error("rollback isolated RSVP lock fixtures");
const cutoff = new Date("2026-12-18T23:00:00Z");
let sql: Sql;
let attendance: typeof saveRsvp;
let party: typeof saveParty;
describe.runIf(process.env.RUN_RSVP_LOCK_DB_TESTS === "1")("RSVP cutoff and atomic history", () => {
  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    sql = postgres(process.env.DATABASE_URL ?? "", { max: 4 });
    attendance = (await import("../../src/modules/invitations/server/save-rsvp")).saveRsvp;
    party = (await import("../../src/modules/invitations/server/party")).saveParty;
  });
  afterAll(async () => {
    if (sql) await sql.end();
  });
  async function exercise(run: (tx: Tx) => Promise<void>) {
    try {
      await drizzle(sql, { schema }).transaction(async (tx) => {
        await run(tx);
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  }
  async function fixture(tx: Tx) {
    await tx
      .insert(schema.eventSettings)
      .values({ id: 1, eventDate: "2026-12-19", timeZone: "Africa/Lagos", rsvpLockAt: cutoff })
      .onConflictDoUpdate({
        target: schema.eventSettings.id,
        set: { eventDate: "2026-12-19", timeZone: "Africa/Lagos", rsvpLockAt: cutoff },
      });
    const [invitation] = await tx
      .insert(schema.invitations)
      .values({ status: "rsvp_yes", householdName: "Lock test only", maxTagAlongs: 2 })
      .returning();
    if (!invitation) throw new Error("Missing fixture");
    const [guest] = await tx
      .insert(schema.guests)
      .values({
        invitationId: invitation.id,
        name: "Test guest",
        isPrimary: true,
        email: "private@example.test",
      })
      .returning();
    if (!guest) throw new Error("Missing guest");
    await tx
      .insert(schema.rsvps)
      .values({ invitationId: invitation.id, attending: true, countAttending: 1 });
    return {
      invitation,
      person: { id: guest.id, name: guest.name, mealChoice: "", dietaryNotes: "" },
    };
  }
  it.each([0, 1])(
    "rejects both mutation paths %i ms after cutoff without history",
    async (offset) => {
      await exercise(async (tx) => {
        const { invitation, person } = await fixture(tx);
        const clock = () => new Date(cutoff.getTime() + offset);
        expect(await attendance(tx, invitation.token, false, clock)).toBe("locked");
        expect(await party(tx, invitation.token, [person], clock)).toMatchObject({
          status: "locked",
          message: "The big day is here, so your RSVP is locked. See you inside.",
        });
        expect(
          await tx
            .select()
            .from(schema.rsvpChanges)
            .where(eq(schema.rsvpChanges.invitationId, invitation.id)),
        ).toEqual([]);
        const [rsvp] = await tx
          .select()
          .from(schema.rsvps)
          .where(eq(schema.rsvps.invitationId, invitation.id));
        expect(rsvp?.attending).toBe(true);
      });
    },
  );
  it("records attendance before/after at one millisecond before cutoff without secrets", async () => {
    await exercise(async (tx) => {
      const { invitation } = await fixture(tx);
      const now = new Date(cutoff.getTime() - 1);
      expect(await attendance(tx, invitation.token, false, () => now)).toBe("saved");
      const history = await tx
        .select()
        .from(schema.rsvpChanges)
        .where(eq(schema.rsvpChanges.invitationId, invitation.id));
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        actor: "guest",
        changedAt: now,
        before: { status: "rsvp_yes", rsvp: { attending: true, countAttending: 1 } },
        after: { status: "rsvp_no", rsvp: { attending: false, countAttending: 0 } },
      });
      expect(JSON.stringify(history)).not.toContain(invitation.token);
      expect(JSON.stringify(history)).not.toContain("private@example.test");
    });
  });
  it("records party additions and removal while keeping the signed-pass version", async () => {
    await exercise(async (tx) => {
      const { invitation, person } = await fixture(tx);
      const first = new Date(cutoff.getTime() - 2);
      expect(
        await party(
          tx,
          invitation.token,
          [person, { ...person, id: "", name: "Companion" }],
          () => first,
        ),
      ).toMatchObject({ status: "saved" });
      expect(
        await party(tx, invitation.token, [person], () => new Date(cutoff.getTime() - 1)),
      ).toMatchObject({ status: "saved" });
      const history = await tx
        .select()
        .from(schema.rsvpChanges)
        .where(eq(schema.rsvpChanges.invitationId, invitation.id))
        .orderBy(asc(schema.rsvpChanges.changedAt));
      expect(history).toHaveLength(2);
      expect(history[0]?.after).toEqual(history[1]?.before);
      expect(history[0]?.after).toMatchObject({ rsvp: { countAttending: 2 } });
      expect(history[1]?.after).toMatchObject({ rsvp: { countAttending: 1 } });
      const [current] = await tx
        .select()
        .from(schema.invitations)
        .where(eq(schema.invitations.id, invitation.id));
      expect(current?.tokenVersion).toBe(invitation.tokenVersion);
    });
  });
  it("serializes concurrent edits into an unbroken before/after history", async () => {
    const database = drizzle(sql, { schema });
    const { invitation } = await database.transaction(fixture);
    try {
      let tick = cutoff.getTime() - 1000;
      const clock = () => new Date(tick++);
      expect(
        await Promise.all([
          attendance(database, invitation.token, false, clock),
          attendance(database, invitation.token, true, clock),
        ]),
      ).toEqual(["saved", "saved"]);
      const history = await database
        .select()
        .from(schema.rsvpChanges)
        .where(eq(schema.rsvpChanges.invitationId, invitation.id))
        .orderBy(asc(schema.rsvpChanges.changedAt));
      expect(history).toHaveLength(2);
      expect(history[0]?.after).toEqual(history[1]?.before);
      const [final] = await database
        .select()
        .from(schema.invitations)
        .where(eq(schema.invitations.id, invitation.id));
      expect(final?.status).toBe(history[1]?.after.status);
      expect(final?.tokenVersion).toBe(invitation.tokenVersion);
    } finally {
      await retireInvitationFixtures(sql, [invitation.id]);
    }
  });
  it("checks time after waiting for the invitation lock", async () => {
    const database = drizzle(sql, { schema });
    const { invitation } = await database.transaction(fixture);
    const held = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    let clockReads = 0;
    let now = new Date(cutoff.getTime() - 1);
    const holding = database.transaction(async (tx) => {
      await tx
        .select()
        .from(schema.invitations)
        .where(eq(schema.invitations.id, invitation.id))
        .for("update");
      held.resolve();
      await release.promise;
    });
    try {
      await held.promise;
      const pending = attendance(database, invitation.token, false, () => {
        clockReads++;
        return now;
      });
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(clockReads).toBe(0);
      now = new Date(cutoff.getTime() + 1);
      release.resolve();
      await holding;
      expect(await pending).toBe("locked");
      expect(clockReads).toBe(1);
      expect(
        await database
          .select()
          .from(schema.rsvpChanges)
          .where(eq(schema.rsvpChanges.invitationId, invitation.id)),
      ).toEqual([]);
    } finally {
      release.resolve();
      await holding;
      await retireInvitationFixtures(sql, [invitation.id]);
    }
  });
  it("rolls the response and history back together", async () => {
    let id = "";
    await exercise(async (tx) => {
      const { invitation } = await fixture(tx);
      id = invitation.id;
      expect(
        await attendance(tx, invitation.token, false, () => new Date(cutoff.getTime() - 1)),
      ).toBe("saved");
      expect(
        await tx.select().from(schema.rsvpChanges).where(eq(schema.rsvpChanges.invitationId, id)),
      ).toHaveLength(1);
    });
    const database = drizzle(sql, { schema });
    expect(
      await database
        .select()
        .from(schema.rsvpChanges)
        .where(eq(schema.rsvpChanges.invitationId, id)),
    ).toEqual([]);
    expect(
      await database.select().from(schema.rsvps).where(eq(schema.rsvps.invitationId, id)),
    ).toEqual([]);
  });
});
