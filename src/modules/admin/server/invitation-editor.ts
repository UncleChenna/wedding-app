import "server-only";
import { createHash } from "node:crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/modules/shared/server/db/client";
import {
  admissionCounters,
  guests,
  invitations,
  invitationLifecycleEvents,
  rsvpChanges,
  rsvps,
  scanEvents,
  tables,
} from "@/modules/shared/server/db/schema";
import { generateInvitationToken } from "@/modules/invitations/lib/token";
import { readRsvpSnapshot, recordRsvpChange } from "@/modules/invitations/history";
import {
  planDraftInvitation,
  type InvitationEditorDetails,
  type InvitationEditorInput,
  type InvitationEditorValues,
} from "../lib/invitation-editor";

type Reader = Pick<Db, "select">;
type Transaction = Parameters<Parameters<Db["transaction"]>[0]>[0];
type Failure =
  "missing" | "conflict" | "invalid" | "table_missing" | "capacity" | "admitted" | "not_draft";
export type EditorResult =
  | { ok: true; id: string; snapshot: string; values: InvitationEditorValues }
  | { ok: false; code: Failure };

async function readStored(database: Reader, id: string) {
  const [invitation] = await database.select().from(invitations).where(eq(invitations.id, id));
  if (!invitation) return null;
  const members = await database
    .select()
    .from(guests)
    .where(eq(guests.invitationId, id))
    .orderBy(asc(guests.id));
  const [reply] = await database.select().from(rsvps).where(eq(rsvps.invitationId, id));
  const [counter] = await database
    .select()
    .from(admissionCounters)
    .where(eq(admissionCounters.invitationId, id));
  // Includes guest changes and gate admissions, not merely the invitation timestamp.
  const snapshot = createHash("sha256")
    .update(JSON.stringify({ invitation, members, reply: reply ?? null, counter: counter ?? null }))
    .digest("hex");
  return {
    invitation,
    members,
    reply: reply ?? null,
    admitted: counter?.admittedPeople ?? 0,
    snapshot,
  };
}

/** Internal reader: route boundary must authorize first. Never returns raw tokens. */
export async function readInvitationEditor(
  database: Reader,
  id: string,
): Promise<InvitationEditorDetails | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const stored = await readStored(database, id);
  if (!stored) return null;
  return {
    id,
    snapshot: stored.snapshot,
    status: stored.invitation.status,
    tokenVersion: stored.invitation.tokenVersion,
    reply: stored.reply
      ? { attending: stored.reply.attending, countAttending: stored.reply.countAttending }
      : null,
    values: editorValues(stored),
  };
}

function editorValues(
  stored: NonNullable<Awaited<ReturnType<typeof readStored>>>,
): InvitationEditorValues {
  return {
    householdName: stored.invitation.householdName ?? "",
    side: stored.invitation.side ?? "",
    tableId: stored.invitation.tableId ?? "",
    maxTagAlongs: String(stored.invitation.maxTagAlongs),
    members: stored.members.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email ?? "",
      phone: member.phone ?? "",
    })),
  };
}

async function tableExists(tx: Transaction, tableId: string | null) {
  if (!tableId) return true;
  return Boolean(
    (await tx.select({ id: tables.id }).from(tables).where(eq(tables.id, tableId)))[0],
  );
}

/** The authenticated action validates input first. Existing RSVPs retain their yes/no answer. */
export async function saveAdminInvitation(
  database: Pick<Db, "transaction">,
  input: InvitationEditorInput,
  actorId: string,
  edit?: { id: string; snapshot: string },
): Promise<EditorResult> {
  if (
    !z.uuid().safeParse(actorId).success ||
    (edit && (!z.uuid().safeParse(edit.id).success || !/^[a-f0-9]{64}$/.test(edit.snapshot)))
  )
    return { ok: false, code: "invalid" };
  return database.transaction(async (tx) => {
    if (!edit) {
      if (input.members.some((member) => member.id)) return { ok: false, code: "invalid" };
      if (!(await tableExists(tx, input.tableId))) return { ok: false, code: "table_missing" };
      const [created] = await tx
        .insert(invitations)
        .values(planDraftInvitation(input, generateInvitationToken))
        .returning({ id: invitations.id });
      if (!created) throw new Error("Invitation creation did not return an id");
      await tx.insert(guests).values(
        input.members.map(({ name, email, phone }) => ({
          invitationId: created.id,
          name,
          email,
          phone,
          isPrimary: true,
          tableId: input.tableId,
        })),
      );
      const stored = await readStored(tx, created.id);
      if (!stored) throw new Error("Created invitation disappeared");
      return { ok: true, id: created.id, snapshot: stored.snapshot, values: editorValues(stored) };
    }
    const [locked] = await tx
      .select({ id: invitations.id })
      .from(invitations)
      .where(eq(invitations.id, edit.id))
      .for("update");
    if (!locked) return { ok: false, code: "missing" };
    const stored = await readStored(tx, edit.id);
    if (!stored) return { ok: false, code: "missing" };
    if (stored.snapshot !== edit.snapshot) return { ok: false, code: "conflict" };
    const existing = new Map(stored.members.map((member) => [member.id, member]));
    if (input.members.some((member) => member.id && !existing.has(member.id)))
      return { ok: false, code: "invalid" };
    if (
      input.members.filter((member) => member.id && existing.get(member.id)?.isPrimary === false)
        .length > input.maxTagAlongs
    )
      return { ok: false, code: "capacity" };
    if (stored.reply?.attending && input.members.length < stored.admitted)
      return { ok: false, code: "admitted" };
    if (!(await tableExists(tx, input.tableId))) return { ok: false, code: "table_missing" };
    const before = await readRsvpSnapshot(tx, edit.id);
    const now = new Date();
    const keep = new Set(input.members.map((member) => member.id));
    const removed = stored.members
      .filter((member) => !keep.has(member.id))
      .map((member) => member.id);
    if (removed.length)
      await tx
        .delete(guests)
        .where(and(eq(guests.invitationId, edit.id), inArray(guests.id, removed)));
    for (const member of input.members) {
      const values = {
        name: member.name,
        email: member.email,
        phone: member.phone,
        ...(input.tableId !== stored.invitation.tableId ? { tableId: input.tableId } : {}),
        updatedAt: now,
      };
      if (member.id)
        await tx
          .update(guests)
          .set(values)
          .where(and(eq(guests.id, member.id), eq(guests.invitationId, edit.id)));
      else
        await tx
          .insert(guests)
          .values({ ...values, tableId: input.tableId, invitationId: edit.id, isPrimary: true });
    }
    if (stored.reply?.attending && stored.reply.countAttending !== input.members.length)
      await tx
        .update(rsvps)
        .set({ countAttending: input.members.length, updatedAt: now })
        .where(eq(rsvps.invitationId, edit.id));
    await tx
      .update(invitations)
      .set({
        householdName: input.householdName,
        side: input.side,
        tableId: input.tableId,
        maxTagAlongs: input.maxTagAlongs,
        updatedAt: now,
      })
      .where(eq(invitations.id, edit.id));
    const after = await readRsvpSnapshot(tx, edit.id);
    if (stored.reply && JSON.stringify(before) !== JSON.stringify(after))
      await recordRsvpChange(tx, edit.id, before, now, `admin:${actorId}`);
    const saved = await readStored(tx, edit.id);
    if (!saved) throw new Error("Saved invitation disappeared");
    return { ok: true, id: edit.id, snapshot: saved.snapshot, values: editorValues(saved) };
  });
}

/** Permanent removal is restricted to an untouched draft with no durable evidence. */
export async function deleteAdminDraft(
  database: Pick<Db, "transaction">,
  id: string,
  snapshot: string,
): Promise<{ ok: true } | { ok: false; code: Failure }> {
  if (!z.uuid().safeParse(id).success || !/^[a-f0-9]{64}$/.test(snapshot))
    return { ok: false, code: "invalid" };
  return database.transaction(async (tx) => {
    const [locked] = await tx
      .select({ id: invitations.id })
      .from(invitations)
      .where(eq(invitations.id, id))
      .for("update");
    if (!locked) return { ok: false, code: "missing" };
    const stored = await readStored(tx, id);
    if (!stored) return { ok: false, code: "missing" };
    if (stored.snapshot !== snapshot) return { ok: false, code: "conflict" };
    if (stored.invitation.status !== "draft" || stored.invitation.sentAt || stored.reply)
      return { ok: false, code: "not_draft" };
    const evidence = await Promise.all([
      tx
        .select({ id: rsvpChanges.id })
        .from(rsvpChanges)
        .where(eq(rsvpChanges.invitationId, id))
        .limit(1),
      tx
        .select({ id: invitationLifecycleEvents.id })
        .from(invitationLifecycleEvents)
        .where(eq(invitationLifecycleEvents.invitationId, id))
        .limit(1),
      tx
        .select({ id: admissionCounters.invitationId })
        .from(admissionCounters)
        .where(eq(admissionCounters.invitationId, id))
        .limit(1),
      tx
        .select({ id: scanEvents.id })
        .from(scanEvents)
        .where(eq(scanEvents.invitationId, id))
        .limit(1),
    ]);
    if (evidence.some((rows) => rows.length)) return { ok: false, code: "not_draft" };
    await tx.delete(invitations).where(eq(invitations.id, id));
    return { ok: true };
  });
}
