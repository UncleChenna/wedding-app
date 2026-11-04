import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import {
  guests,
  invitations,
  memberRsvps,
  rsvps,
  rsvpChanges,
  rsvpReceipts,
} from "@/modules/shared/server/db/schema";
import { getEventSettings } from "@/modules/shared/server/settings";
import { invitationTokenSchema } from "../lib/token";
import { memberRsvpInputSchema, repliesAllowed, rsvpFingerprint } from "../lib/member-rsvp";

export type MemberRsvpResult =
  | { ok: true; revision: number; countAttending: number; replayed: boolean }
  | {
      ok: false;
      code: "invalid" | "unavailable" | "not-open" | "locked" | "conflict" | "request-conflict";
      revision?: number;
    };

/** Personal capability authorizes the invitation; submitted member identifiers never grant access. */
export async function saveMemberRsvp(
  database: Pick<Db, "transaction">,
  token: unknown,
  input: unknown,
  options: { now?: Date } = {},
): Promise<MemberRsvpResult> {
  const credential = invitationTokenSchema.safeParse(token);
  const parsed = memberRsvpInputSchema.safeParse(input);
  if (!credential.success || !parsed.success) return { ok: false, code: "invalid" };
  const request = parsed.data;
  const fingerprint = rsvpFingerprint(request);
  return database.transaction(async (tx) => {
    const [invitation] = await tx
      .select({
        id: invitations.id,
        revision: invitations.rsvpRevision,
        reopenUntil: invitations.rsvpReopenUntil,
      })
      .from(invitations)
      .where(
        and(
          eq(invitations.token, credential.data),
          inArray(invitations.status, ["sent", "rsvp_yes", "rsvp_no"]),
        ),
      )
      .for("update");
    if (!invitation) return { ok: false, code: "unavailable" };
    const [receipt] = await tx
      .select()
      .from(rsvpReceipts)
      .where(
        and(
          eq(rsvpReceipts.invitationId, invitation.id),
          eq(rsvpReceipts.requestId, request.requestId),
        ),
      );
    // Replay a completed request even after the deadline; it performs no new mutation.
    if (receipt)
      return receipt.fingerprint === fingerprint
        ? {
            ok: true,
            revision: receipt.revision,
            countAttending: receipt.countAttending,
            replayed: true,
          }
        : { ok: false, code: "request-conflict" };
    if (request.expectedRevision !== invitation.revision)
      return { ok: false, code: "conflict", revision: invitation.revision };
    const settings = await getEventSettings(tx);
    if (!settings.timeZone) return { ok: false, code: "not-open" };
    const now = options.now ?? new Date();
    if (!repliesAllowed(settings.rsvpLockAt, invitation.reopenUntil, now))
      return { ok: false, code: "locked" };
    const party = await tx
      .select({
        id: guests.id,
        dietaryNotes: guests.dietaryNotes,
        attendance: memberRsvps.attendance,
      })
      .from(guests)
      .leftJoin(memberRsvps, eq(memberRsvps.guestId, guests.id))
      .where(eq(guests.invitationId, invitation.id))
      .orderBy(guests.id);
    if (
      !party.length ||
      request.members.some((member) => !party.some((person) => person.id === member.guestId))
    )
      return { ok: false, code: "unavailable" };
    // During the additive rollout, derive not-yet-materialized legacy member answers from the aggregate.
    const [legacy] = await tx
      .select({ attending: rsvps.attending, respondedAt: rsvps.respondedAt })
      .from(rsvps)
      .where(eq(rsvps.invitationId, invitation.id));
    const before = party.map((person) => ({
      guestId: person.id,
      attendance: person.attendance ?? (legacy ? (legacy.attending ? "yes" : "no") : "pending"),
      dietaryNotes: person.dietaryNotes ?? "",
    }));
    const after = before.map(
      (person) => request.members.find((member) => member.guestId === person.guestId) ?? person,
    );
    // Materialize the whole prior state once, including pending people. Otherwise a later
    // partial edit could infer an unanswered person's answer from the changed aggregate.
    for (const person of before)
      await tx
        .insert(memberRsvps)
        .values({
          guestId: person.guestId,
          invitationId: invitation.id,
          attendance: person.attendance,
          respondedAt: person.attendance === "pending" ? null : (legacy?.respondedAt ?? now),
        })
        .onConflictDoNothing({ target: memberRsvps.guestId });
    for (const member of request.members) {
      await tx
        .insert(memberRsvps)
        .values({
          guestId: member.guestId,
          invitationId: invitation.id,
          attendance: member.attendance,
          respondedAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: memberRsvps.guestId,
          set: { attendance: member.attendance, respondedAt: now, updatedAt: now },
        });
      await tx
        .update(guests)
        .set({ dietaryNotes: member.dietaryNotes || null, updatedAt: now })
        .where(and(eq(guests.id, member.guestId), eq(guests.invitationId, invitation.id)));
    }
    const countAttending = after.filter((person) => person.attendance === "yes").length;
    const revision = invitation.revision + 1;
    await tx
      .insert(rsvps)
      .values({
        invitationId: invitation.id,
        attending: countAttending > 0,
        countAttending,
        respondedAt: now,
      })
      .onConflictDoUpdate({
        target: rsvps.invitationId,
        set: { attending: countAttending > 0, countAttending, respondedAt: now, updatedAt: now },
      });
    await tx
      .update(invitations)
      .set({
        rsvpRevision: revision,
        status:
          countAttending > 0
            ? "rsvp_yes"
            : after.some((person) => person.attendance === "pending")
              ? "sent"
              : "rsvp_no",
        updatedAt: now,
      })
      .where(eq(invitations.id, invitation.id));
    await tx.insert(rsvpChanges).values({
      invitationId: invitation.id,
      before: { revision: invitation.revision, members: before },
      after: { revision, members: after },
      actor: `invitation:${invitation.id}`,
      changedAt: now,
    });
    await tx.insert(rsvpReceipts).values({
      invitationId: invitation.id,
      requestId: request.requestId,
      fingerprint,
      revision,
      countAttending,
    });
    return { ok: true, revision, countAttending, replayed: false };
  });
}
