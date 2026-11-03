import "server-only";
import { asc, eq } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import { guests, invitations, rsvps, rsvpChanges } from "@/modules/shared/server/db/schema";

/** Called only inside a transaction holding this invitation's row lock. */
export async function readRsvpSnapshot(database: Pick<Db, "select">, invitationId: string) {
  const [invitation] = await database
    .select({ status: invitations.status })
    .from(invitations)
    .where(eq(invitations.id, invitationId));
  if (!invitation) throw new Error("Locked invitation disappeared");
  const [rsvp] = await database
    .select({
      attending: rsvps.attending,
      countAttending: rsvps.countAttending,
      respondedAt: rsvps.respondedAt,
    })
    .from(rsvps)
    .where(eq(rsvps.invitationId, invitationId));
  const people = await database
    .select({
      id: guests.id,
      name: guests.name,
      isPrimary: guests.isPrimary,
      mealChoice: guests.mealChoice,
      dietaryNotes: guests.dietaryNotes,
    })
    .from(guests)
    .where(eq(guests.invitationId, invitationId))
    .orderBy(asc(guests.id));
  return {
    status: invitation.status,
    rsvp: rsvp ? { ...rsvp, respondedAt: rsvp.respondedAt.toISOString() } : null,
    people,
  };
}

export async function recordRsvpChange(
  database: Pick<Db, "select" | "insert">,
  invitationId: string,
  before: Awaited<ReturnType<typeof readRsvpSnapshot>>,
  changedAt: Date,
) {
  const after = await readRsvpSnapshot(database, invitationId);
  await database
    .insert(rsvpChanges)
    .values({ invitationId, before, after, actor: "guest", changedAt });
}
