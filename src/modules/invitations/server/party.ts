import "server-only";
import { rsvpWindow } from "../lib/rsvp-window";
import { invitationSiteCopy } from "../lib/copy";
import { readRsvpSnapshot, recordRsvpChange } from "./rsvp-history";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import { guests, invitations, menuItems, rsvps } from "@/modules/shared/server/db/schema";
import { getEventSettings } from "@/modules/shared/server/settings";
import { invitationTokenSchema } from "../lib/token";
import { validateParty, type PartyDetails, type PartyState } from "../lib/party";

const published = ["sent", "rsvp_yes", "rsvp_no"] as const;
export async function readParty(
  database: Pick<Db, "select">,
  token: unknown,
): Promise<PartyDetails | null> {
  const parsed = invitationTokenSchema.safeParse(token);
  if (!parsed.success) return null;
  const [invitation] = await database
    .select({ id: invitations.id, maxTagAlongs: invitations.maxTagAlongs })
    .from(invitations)
    .where(and(eq(invitations.token, parsed.data), inArray(invitations.status, [...published])));
  if (!invitation) return null;
  const rows = await database
    .select({
      id: guests.id,
      name: guests.name,
      mealChoice: guests.mealChoice,
      dietaryNotes: guests.dietaryNotes,
      isPrimary: guests.isPrimary,
    })
    .from(guests)
    .where(eq(guests.invitationId, invitation.id))
    .orderBy(asc(guests.createdAt), asc(guests.id));
  const meals = await database
    .select({ id: menuItems.id, name: menuItems.name })
    .from(menuItems)
    .where(and(eq(menuItems.category, "meal"), eq(menuItems.isAvailable, true)))
    .orderBy(asc(menuItems.sortOrder), asc(menuItems.name));
  return {
    maxTagAlongs: invitation.maxTagAlongs,
    meals,
    people: rows.map((row) => ({
      ...row,
      mealChoice: row.mealChoice ?? "",
      dietaryNotes: row.dietaryNotes ?? "",
    })),
  };
}

export async function saveParty(
  database: Pick<Db, "transaction">,
  token: unknown,
  input: unknown,
  clock: () => Date = () => new Date(),
): Promise<PartyState> {
  const parsed = invitationTokenSchema.safeParse(token);
  if (!parsed.success)
    return {
      status: "error",
      message: "This invitation is unavailable. Please contact the couple.",
    };
  return database.transaction(async (tx) => {
    const [invitation] = await tx
      .select({
        id: invitations.id,
        status: invitations.status,
        maxTagAlongs: invitations.maxTagAlongs,
      })
      .from(invitations)
      .where(and(eq(invitations.token, parsed.data), inArray(invitations.status, [...published])))
      .for("update");
    if (!invitation)
      return {
        status: "error",
        message: "This invitation is unavailable. Please contact the couple.",
      };
    if (invitation.status !== "rsvp_yes")
      return {
        status: "error",
        message: "Please let us know you’re coming before saving your guests.",
      };
    const settings = await getEventSettings(tx);
    const now = clock();
    const window = rsvpWindow(settings, now);
    if (window === "locked") return { status: "locked", message: invitationSiteCopy.editsLocked };
    if (window === "not-open")
      return { status: "error", message: "Replies aren’t open just yet. Please check back soon." };
    const details = await readParty(tx, parsed.data);
    if (!details)
      return {
        status: "error",
        message: "This invitation is unavailable. Please contact the couple.",
      };
    const result = validateParty(input, details.people, invitation.maxTagAlongs, details.meals);
    if (!result.ok) return { status: "error", message: result.message };
    const before = await readRsvpSnapshot(tx, invitation.id);
    const keep = new Set(result.people.map((person) => person.id));
    const removed = details.people
      .filter((person) => !person.isPrimary && !keep.has(person.id))
      .map((person) => person.id);
    if (removed.length)
      await tx
        .delete(guests)
        .where(
          and(
            eq(guests.invitationId, invitation.id),
            eq(guests.isPrimary, false),
            inArray(guests.id, removed),
          ),
        );
    for (const person of result.people) {
      const values = {
        name: person.name,
        mealChoice: person.mealChoice || null,
        dietaryNotes: person.dietaryNotes || null,
        isPrimary: person.isPrimary,
        updatedAt: now,
      };
      if (person.id)
        await tx
          .update(guests)
          .set(values)
          .where(and(eq(guests.id, person.id), eq(guests.invitationId, invitation.id)));
      else await tx.insert(guests).values({ ...values, invitationId: invitation.id });
    }
    await tx
      .insert(rsvps)
      .values({
        invitationId: invitation.id,
        attending: true,
        countAttending: result.countAttending,
        respondedAt: now,
      })
      .onConflictDoUpdate({
        target: rsvps.invitationId,
        set: {
          attending: true,
          countAttending: result.countAttending,
          respondedAt: now,
          updatedAt: now,
        },
      });
    await tx.update(invitations).set({ updatedAt: now }).where(eq(invitations.id, invitation.id));
    await recordRsvpChange(tx, invitation.id, before, now);
    return {
      status: "saved",
      message: "Your guest details are saved. We’re looking forward to seeing you.",
    };
  });
}
