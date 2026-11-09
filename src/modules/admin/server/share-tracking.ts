import "server-only";
import { and, desc, eq, getTableColumns, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/modules/shared/server/db/client";
import { invitations, invitationShareEvents, rsvps } from "@/modules/shared/server/db/schema";
import { planShare, planShareUndo, shareTrackingInputSchema } from "../lib/share-tracking";
import { reminderEligible } from "../lib/reminders";

const undoSchema = z.object({ invitationId: z.uuid(), eventId: z.uuid() });
const rejected = {
  ok: false,
  message: "This invitation changed. Refresh and check it before trying again.",
} as const;

export async function recordInvitationShare(
  input: unknown,
  actorId: string,
  database: Pick<Db, "transaction">,
) {
  const parsed = shareTrackingInputSchema.safeParse(input);
  if (!parsed.success || !z.uuid().safeParse(actorId).success) return rejected;
  const data = parsed.data;
  return database.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(invitations)
      .where(eq(invitations.id, data.invitationId))
      .for("update");
    if (!current) return rejected;
    const plan = planShare(current, data.expectedVersion, new Date());
    if (!plan.ok) return rejected;
    const [existing] = await tx
      .select()
      .from(invitationShareEvents)
      .where(eq(invitationShareEvents.id, data.requestId));
    if (existing) {
      return existing.invitationId === current.id &&
        existing.actorId === actorId &&
        existing.channel === data.channel &&
        existing.purpose === data.purpose &&
        existing.tokenVersion === data.expectedVersion &&
        !existing.undoneAt
        ? ({ ok: true, eventId: existing.id } as const)
        : rejected;
    }
    if (data.purpose === "reminder") {
      const [reply] = await tx
        .select({ id: rsvps.id })
        .from(rsvps)
        .where(eq(rsvps.invitationId, current.id));
      if (!reminderEligible(current.status, !!reply)) return rejected;
    }
    await tx.insert(invitationShareEvents).values({
      id: data.requestId,
      invitationId: current.id,
      actorId,
      channel: data.channel,
      purpose: data.purpose,
      tokenVersion: current.tokenVersion,
      previousStatus: current.status,
      previousSentAt: current.sentAt,
    });
    await tx
      .update(invitations)
      .set({ status: plan.status, sentAt: plan.sentAt, updatedAt: new Date() })
      .where(eq(invitations.id, current.id));
    return { ok: true, eventId: data.requestId } as const;
  });
}

export async function undoInvitationShare(
  input: unknown,
  actorId: string,
  database: Pick<Db, "transaction">,
) {
  const parsed = undoSchema.safeParse(input);
  if (!parsed.success || !z.uuid().safeParse(actorId).success) return rejected;
  return database.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(invitations)
      .where(eq(invitations.id, parsed.data.invitationId))
      .for("update");
    if (!current) return rejected;
    const [event] = await tx
      .select({
        ...getTableColumns(invitationShareEvents),
        expired: sql<boolean>`${invitationShareEvents.createdAt} < clock_timestamp() - interval '10 minutes'`,
      })
      .from(invitationShareEvents)
      .where(
        and(
          eq(invitationShareEvents.id, parsed.data.eventId),
          eq(invitationShareEvents.invitationId, current.id),
        ),
      );
    if (!event || event.actorId !== actorId || event.undoneAt || event.expired) return rejected;
    const [latest] = await tx
      .select()
      .from(invitationShareEvents)
      .where(eq(invitationShareEvents.invitationId, current.id))
      .orderBy(desc(invitationShareEvents.sequence))
      .limit(1);
    const plan = planShareUndo(
      current,
      {
        status: event.previousStatus,
        sentAt: event.previousSentAt,
        tokenVersion: event.tokenVersion,
      },
      latest?.id === event.id,
    );
    if (!plan.ok) return rejected;
    await tx
      .update(invitationShareEvents)
      .set({ undoneAt: sql`greatest(clock_timestamp(), ${invitationShareEvents.createdAt})` })
      .where(eq(invitationShareEvents.id, event.id));
    await tx
      .update(invitations)
      .set({ status: plan.status, sentAt: plan.sentAt, updatedAt: new Date() })
      .where(eq(invitations.id, current.id));
    return { ok: true } as const;
  });
}
