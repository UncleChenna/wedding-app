import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import {
  deleteAdminDraft,
  readInvitationEditor,
  saveAdminInvitation,
} from "../../src/modules/admin/server/invitation-editor";
import {
  invitationEditorSchema,
  type InvitationEditorDetails,
} from "../../src/modules/admin/lib/invitation-editor";
import { readRsvpSnapshot, recordRsvpChange } from "../../src/modules/invitations/history";
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
const rollback = new Error("rollback synthetic editor fixtures");
const actor = randomUUID();
let client: Sql;
const input = () =>
  invitationEditorSchema.parse({
    householdName: "Synthetic editor",
    side: "Family",
    tableId: "",
    maxTagAlongs: "1",
    members: [
      { id: "", name: "Synthetic guest", email: "guest@example.invalid", phone: "+447700900123" },
    ],
  });
async function details(tx: Tx, id: string): Promise<InvitationEditorDetails> {
  const result = await readInvitationEditor(tx, id);
  if (!result) throw new Error("Missing fixture");
  return result;
}
async function create(tx: Tx) {
  const result = await saveAdminInvitation(tx, input(), actor);
  if (!result.ok) throw new Error(result.code);
  return result;
}
async function edit(tx: Tx, current: InvitationEditorDetails, values = current.values) {
  return saveAdminInvitation(tx, invitationEditorSchema.parse(values), actor, {
    id: current.id,
    snapshot: current.snapshot,
  });
}
describe.runIf(process.env.RUN_INVITATION_EDITOR_DB_TESTS === "1")(
  "admin invitation editing on isolated PostgreSQL",
  () => {
    beforeAll(async () => {
      process.loadEnvFile(".env.local");
      const url = process.env.DATABASE_URL ?? "";
      assertDatabaseTarget(url, { localOnly: true });
      client = postgres(url, { max: 2, connect_timeout: 10 });
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
    it("creates unique draft capabilities and deletes only untouched drafts", async () =>
      exercise(async (tx) => {
        const first = await create(tx),
          second = await create(tx);
        const [stored] = await tx
          .select()
          .from(schema.invitations)
          .where(eq(schema.invitations.id, first.id));
        const [other] = await tx
          .select()
          .from(schema.invitations)
          .where(eq(schema.invitations.id, second.id));
        expect(stored).toMatchObject({ status: "draft", tokenVersion: 1 });
        expect(stored?.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
        expect(other?.token).not.toBe(stored?.token);
        expect(first.values.members[0]?.id).toMatch(/^[a-f0-9-]{36}$/);
        expect(await deleteAdminDraft(tx, first.id, first.snapshot)).toEqual({ ok: true });
        expect(await readInvitationEditor(tx, first.id)).toBeNull();
        expect(
          await tx.select().from(schema.guests).where(eq(schema.guests.invitationId, first.id)),
        ).toEqual([]);
        await tx
          .update(schema.invitations)
          .set({ status: "sent", sentAt: new Date() })
          .where(eq(schema.invitations.id, second.id));
        const sent = await details(tx, second.id);
        expect(await deleteAdminDraft(tx, sent.id, sent.snapshot)).toEqual({
          ok: false,
          code: "not_draft",
        });
      }));
    it("preserves capability, meals and RSVP date while auditing an explicit roster correction", async () =>
      exercise(async (tx) => {
        const created = await create(tx);
        const originalDate = new Date("2026-10-01T12:00:00Z");
        await tx
          .update(schema.invitations)
          .set({ status: "rsvp_yes" })
          .where(eq(schema.invitations.id, created.id));
        await tx
          .update(schema.guests)
          .set({ mealChoice: "Vegetarian", dietaryNotes: "No nuts" })
          .where(eq(schema.guests.invitationId, created.id));
        await tx.insert(schema.rsvps).values({
          invitationId: created.id,
          attending: true,
          countAttending: 1,
          respondedAt: originalDate,
        });
        const [before] = await tx
          .select()
          .from(schema.invitations)
          .where(eq(schema.invitations.id, created.id));
        const current = await details(tx, created.id);
        const values = {
          ...current.values,
          members: [
            ...current.values.members,
            { id: "", name: "Added named guest", email: "", phone: "" },
          ],
        };
        const saved = await edit(tx, current, values);
        expect(saved.ok).toBe(true);
        const [reply] = await tx
          .select()
          .from(schema.rsvps)
          .where(eq(schema.rsvps.invitationId, created.id));
        expect(reply).toMatchObject({
          attending: true,
          countAttending: 2,
          respondedAt: originalDate,
        });
        const [after] = await tx
          .select()
          .from(schema.invitations)
          .where(eq(schema.invitations.id, created.id));
        expect(after).toMatchObject({
          token: before?.token,
          tokenVersion: before?.tokenVersion,
          status: "rsvp_yes",
        });
        const members = await tx
          .select()
          .from(schema.guests)
          .where(eq(schema.guests.invitationId, created.id));
        expect(members.find((member) => member.id === current.values.members[0]?.id)).toMatchObject(
          { mealChoice: "Vegetarian", dietaryNotes: "No nuts" },
        );
        const history = await tx
          .select()
          .from(schema.rsvpChanges)
          .where(eq(schema.rsvpChanges.invitationId, created.id));
        expect(history).toHaveLength(1);
        expect(history[0]?.actor).toBe(`admin:${actor}`);
        expect(JSON.stringify(history)).not.toContain("guest@example.invalid");
        expect(JSON.stringify(history)).not.toContain(before?.token);
        if (!saved.ok) throw new Error("Expected save");
        expect(await edit(tx, await details(tx, created.id), saved.values)).toMatchObject({
          ok: true,
        });
        expect(
          await tx
            .select()
            .from(schema.rsvpChanges)
            .where(eq(schema.rsvpChanges.invitationId, created.id)),
        ).toHaveLength(1);
      }));
    it("keeps a declined response declined and rejects stale guest/RSVP changes", async () =>
      exercise(async (tx) => {
        const created = await create(tx);
        const stale = await details(tx, created.id);
        await tx
          .update(schema.invitations)
          .set({ status: "rsvp_no" })
          .where(eq(schema.invitations.id, created.id));
        await tx
          .insert(schema.rsvps)
          .values({ invitationId: created.id, attending: false, countAttending: 0 });
        expect(await edit(tx, stale)).toEqual({ ok: false, code: "conflict" });
        const current = await details(tx, created.id);
        expect(
          await edit(tx, current, {
            ...current.values,
            members: [
              ...current.values.members,
              { id: "", name: "Another guest", email: "", phone: "" },
            ],
          }),
        ).toMatchObject({ ok: true });
        const [reply] = await tx
          .select()
          .from(schema.rsvps)
          .where(eq(schema.rsvps.invitationId, created.id));
        expect(reply).toMatchObject({ attending: false, countAttending: 0 });
        const outdated = await details(tx, created.id);
        await tx
          .update(schema.guests)
          .set({ dietaryNotes: "New guest reply" })
          .where(eq(schema.guests.invitationId, created.id));
        expect(await edit(tx, outdated)).toEqual({ ok: false, code: "conflict" });
      }));
    it("rejects foreign guest identities and retains the guest actor default", async () =>
      exercise(async (tx) => {
        const created = await create(tx),
          other = await create(tx);
        const current = await details(tx, created.id);
        expect(
          await edit(tx, current, { ...current.values, members: other.values.members }),
        ).toEqual({ ok: false, code: "invalid" });
        const before = await readRsvpSnapshot(tx, created.id);
        await recordRsvpChange(tx, created.id, before, new Date());
        const [history] = await tx
          .select()
          .from(schema.rsvpChanges)
          .where(eq(schema.rsvpChanges.invitationId, created.id));
        expect(history?.actor).toBe("guest");
        expect(
          await deleteAdminDraft(tx, created.id, (await details(tx, created.id)).snapshot),
        ).toEqual({ ok: false, code: "not_draft" });
      }));
    it("rejects stale admission snapshots and never shrinks a party below admitted people", async () =>
      exercise(async (tx) => {
        const created = await create(tx);
        let current = await details(tx, created.id);
        await edit(tx, current, {
          ...current.values,
          members: [
            ...current.values.members,
            { id: "", name: "Second guest", email: "", phone: "" },
          ],
        });
        await tx
          .update(schema.invitations)
          .set({ status: "rsvp_yes" })
          .where(eq(schema.invitations.id, created.id));
        await tx
          .insert(schema.rsvps)
          .values({ invitationId: created.id, attending: true, countAttending: 2 });
        current = await details(tx, created.id);
        const [staff] = await tx
          .insert(schema.staff)
          .values({ name: "Synthetic gate", role: "gate" })
          .returning();
        if (!staff) throw new Error("Missing staff");
        const device = randomUUID();
        await tx.insert(schema.registeredDevices).values({
          id: device,
          name: "Synthetic scanner",
          role: "gate",
          registeredByStaffId: staff.id,
        });
        await tx.insert(schema.scanEvents).values({
          clientEventId: randomUUID(),
          invitationId: created.id,
          staffId: staff.id,
          deviceId: device,
          reportedAt: new Date(),
          reportedResult: "valid",
          result: "valid",
          reportedPeople: 2,
          admittedPeople: 2,
          source: "online",
        });
        expect(await edit(tx, current)).toEqual({ ok: false, code: "conflict" });
        const admitted = await details(tx, created.id);
        expect(
          await edit(tx, admitted, {
            ...admitted.values,
            members: admitted.values.members.slice(0, 1),
          }),
        ).toEqual({ ok: false, code: "admitted" });
        expect((await details(tx, created.id)).values.members).toHaveLength(2);
      }));
  },
);
