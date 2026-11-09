import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import {
  recordInvitationShare,
  undoInvitationShare,
} from "../../src/modules/admin/server/share-tracking";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
const actor = randomUUID();
const rollback = new Error("rollback synthetic share fixtures");
let client: Sql;
describe.runIf(process.env.RUN_SHARE_TRACKING_DB_TESTS === "1")("sharing persistence", () => {
  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    client = postgres(process.env.DATABASE_URL ?? "", { max: 2, connect_timeout: 10 });
    await client`select 1`;
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
    } catch (error) {
      if (error !== rollback) throw error;
    }
  }
  async function fixture(tx: Tx) {
    const [row] = await tx
      .insert(schema.invitations)
      .values({ householdName: "Synthetic sharing fixture" })
      .returning();
    if (!row) throw new Error("Missing fixture");
    return row;
  }
  function command(invitationId: string) {
    return { invitationId, expectedVersion: 1, channel: "copy", requestId: randomUUID() };
  }
  it("publishes once, deduplicates retries and preserves first timestamp and RSVP", async () =>
    exercise(async (tx) => {
      const invitation = await fixture(tx);
      const input = command(invitation.id);
      expect((await recordInvitationShare(input, actor, tx)).ok).toBe(true);
      expect((await recordInvitationShare(input, actor, tx)).ok).toBe(true);
      const [first] = await tx
        .select()
        .from(schema.invitations)
        .where(eq(schema.invitations.id, invitation.id));
      expect(first?.status).toBe("sent");
      expect(first?.sentAt).toBeInstanceOf(Date);
      expect(
        await tx
          .select()
          .from(schema.invitationShareEvents)
          .where(eq(schema.invitationShareEvents.invitationId, invitation.id)),
      ).toHaveLength(1);
      await tx
        .update(schema.invitations)
        .set({ status: "rsvp_no" })
        .where(eq(schema.invitations.id, invitation.id));
      expect(
        (
          await recordInvitationShare(
            { ...input, requestId: randomUUID(), channel: "email" },
            actor,
            tx,
          )
        ).ok,
      ).toBe(true);
      const [again] = await tx
        .select()
        .from(schema.invitations)
        .where(eq(schema.invitations.id, invitation.id));
      expect(again?.status).toBe("rsvp_no");
      expect(again?.sentAt).toEqual(first?.sentAt);
    }));
  it("undo is actor-bound and latest-only, preserving a subsequent RSVP", async () =>
    exercise(async (tx) => {
      const invitation = await fixture(tx);
      const first = command(invitation.id);
      await recordInvitationShare(first, actor, tx);
      expect(
        (
          await undoInvitationShare(
            { invitationId: invitation.id, eventId: first.requestId },
            randomUUID(),
            tx,
          )
        ).ok,
      ).toBe(false);
      await tx
        .update(schema.invitations)
        .set({ status: "rsvp_yes" })
        .where(eq(schema.invitations.id, invitation.id));
      expect(
        (
          await undoInvitationShare(
            { invitationId: invitation.id, eventId: first.requestId },
            actor,
            tx,
          )
        ).ok,
      ).toBe(true);
      const [current] = await tx
        .select()
        .from(schema.invitations)
        .where(eq(schema.invitations.id, invitation.id));
      expect(current?.status).toBe("rsvp_yes");
      expect(current?.sentAt).toBeNull();
      const [event] = await tx
        .select()
        .from(schema.invitationShareEvents)
        .where(eq(schema.invitationShareEvents.id, first.requestId));
      expect(event?.undoneAt).toBeInstanceOf(Date);
      const second = command(invitation.id);
      const third = command(invitation.id);
      await recordInvitationShare(second, actor, tx);
      await recordInvitationShare(third, actor, tx);
      expect(
        (
          await undoInvitationShare(
            { invitationId: invitation.id, eventId: second.requestId },
            actor,
            tx,
          )
        ).ok,
      ).toBe(false);
    }));
  it("revocation or reissue prevents stale sharing and Undo", async () =>
    exercise(async (tx) => {
      const invitation = await fixture(tx);
      const input = command(invitation.id);
      await recordInvitationShare(input, actor, tx);
      await tx
        .update(schema.invitations)
        .set({ status: "revoked", tokenVersion: 2 })
        .where(eq(schema.invitations.id, invitation.id));
      expect((await recordInvitationShare(command(invitation.id), actor, tx)).ok).toBe(false);
      expect(
        (
          await undoInvitationShare(
            { invitationId: invitation.id, eventId: input.requestId },
            actor,
            tx,
          )
        ).ok,
      ).toBe(false);
    }));
});
