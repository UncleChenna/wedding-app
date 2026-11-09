import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import { readReminderRows } from "../../src/modules/admin/server/reminder-repository";
import {
  recordInvitationShare,
  undoInvitationShare,
} from "../../src/modules/admin/server/share-tracking";
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
const actor = randomUUID();
const rollback = new Error("rollback synthetic reminder fixtures");
let client: Sql;
describe.runIf(process.env.RUN_REMINDERS_DB_TESTS === "1")("reminder persistence", () => {
  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    client = postgres(url, { max: 2, connect_timeout: 10 });
  });
  afterAll(async () => {
    if (client) await client.end();
  });
  async function exercise(run: (tx: Tx) => Promise<void>) {
    try {
      await drizzle(client, { schema }).transaction(async (tx) => {
        await run(tx);
        throw rollback;
      });
    } catch (e) {
      if (e !== rollback) throw e;
    }
  }
  it("selects exactly sent with no RSVP and latest current non-undone sharing time", async () =>
    exercise(async (tx) => {
      const rows = await tx
        .insert(schema.invitations)
        .values(
          ["draft", "sent", "rsvp_yes", "rsvp_no", "revoked", "sent"].map((status) => ({
            householdName: randomUUID(),
            status: schema.invitationStatus.enumValues.find((s) => s === status) ?? "draft",
            sentAt: new Date("2026-10-01T00:00:00Z"),
          })),
        )
        .returning();
      const eligible = rows[1];
      const inconsistent = rows[5];
      if (!eligible || !inconsistent) throw new Error("fixture");
      await tx
        .insert(schema.rsvps)
        .values({ invitationId: inconsistent.id, attending: false, countAttending: 0 });
      await tx.insert(schema.invitationShareEvents).values(
        [
          { tokenVersion: 1, createdAt: new Date("2026-10-02T00:00:00Z"), undoneAt: null },
          {
            tokenVersion: 1,
            createdAt: new Date("2026-10-03T00:00:00Z"),
            undoneAt: new Date("2026-10-03T00:01:00Z"),
          },
          { tokenVersion: 2, createdAt: new Date("2026-10-04T00:00:00Z"), undoneAt: null },
        ].map((event) => ({
          ...event,
          id: randomUUID(),
          invitationId: eligible.id,
          actorId: actor,
          channel: "copy",
          previousStatus: "sent" as const,
          purpose: "reminder",
        })),
      );
      const actual = (await readReminderRows(tx)).filter((row) =>
        rows.some((fixture) => fixture.id === row.id),
      );
      expect(actual).toHaveLength(1);
      expect(actual[0]?.id).toBe(eligible.id);
      expect(new Date(actual[0]?.lastSharedAt ?? "").toISOString()).toBe(
        "2026-10-02T00:00:00.000Z",
      );
    }));
  it("records a minimal reminder once, rejects stale eligibility and Undo preserves reply and first sent time", async () =>
    exercise(async (tx) => {
      const sentAt = new Date("2026-10-01T00:00:00Z");
      const [invitation] = await tx
        .insert(schema.invitations)
        .values({ householdName: randomUUID(), status: "sent", sentAt })
        .returning();
      if (!invitation) throw new Error("fixture");
      const input = {
        invitationId: invitation.id,
        expectedVersion: 1,
        channel: "copy",
        requestId: randomUUID(),
        purpose: "reminder",
      };
      expect((await recordInvitationShare(input, actor, tx)).ok).toBe(true);
      expect((await recordInvitationShare(input, actor, tx)).ok).toBe(true);
      expect((await recordInvitationShare({ ...input, purpose: "invitation" }, actor, tx)).ok).toBe(
        false,
      );
      const events = await tx
        .select()
        .from(schema.invitationShareEvents)
        .where(eq(schema.invitationShareEvents.invitationId, invitation.id));
      expect(events).toHaveLength(1);
      expect(events[0]?.purpose).toBe("reminder");
      expect(events[0]).not.toHaveProperty("message");
      await tx
        .insert(schema.rsvps)
        .values({ invitationId: invitation.id, attending: false, countAttending: 0 });
      expect(
        (await recordInvitationShare({ ...input, requestId: randomUUID() }, actor, tx)).ok,
      ).toBe(false);
      await tx
        .update(schema.invitations)
        .set({ status: "rsvp_no" })
        .where(eq(schema.invitations.id, invitation.id));
      expect(
        (
          await undoInvitationShare(
            { invitationId: invitation.id, eventId: input.requestId },
            actor,
            tx,
          )
        ).ok,
      ).toBe(true);
      const [after] = await tx
        .select()
        .from(schema.invitations)
        .where(eq(schema.invitations.id, invitation.id));
      expect(after?.status).toBe("rsvp_no");
      expect(after?.sentAt).toEqual(sentAt);
      expect(
        await tx.select().from(schema.rsvps).where(eq(schema.rsvps.invitationId, invitation.id)),
      ).toHaveLength(1);
    }));
  it("rejects draft, revoked and changed-version reminder attempts without writing", async () =>
    exercise(async (tx) => {
      const rows = await tx
        .insert(schema.invitations)
        .values([{ status: "draft" }, { status: "revoked" }, { status: "sent", tokenVersion: 2 }])
        .returning();
      for (const row of rows)
        expect(
          (
            await recordInvitationShare(
              {
                invitationId: row.id,
                requestId: randomUUID(),
                expectedVersion: 1,
                channel: "email",
                purpose: "reminder",
              },
              actor,
              tx,
            )
          ).ok,
        ).toBe(false);
      expect(
        await tx
          .select()
          .from(schema.invitationShareEvents)
          .where(
            inArray(
              schema.invitationShareEvents.invitationId,
              rows.map((r) => r.id),
            ),
          ),
      ).toEqual([]);
    }));
});
