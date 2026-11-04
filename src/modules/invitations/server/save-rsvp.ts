import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import { guests, invitations } from "@/modules/shared/server/db/schema";
import { getEventSettings } from "@/modules/shared/server/settings";
import { invitationTokenSchema } from "../lib/token";
import type { SaveRsvpResult } from "./submit-rsvp";
import { saveMemberRsvp } from "./save-member-rsvp";

/** Token capability is checked again inside the transaction; a rendered form is not authorization. */
export async function saveRsvp(
  database: Pick<Db, "transaction">,
  token: string,
  attending: boolean,
  options?: { expectedRevision: number; requestId: string; now?: Date },
): Promise<SaveRsvpResult> {
  const parsed = invitationTokenSchema.safeParse(token);
  if (!parsed.success) return "unavailable";
  return database.transaction(async (tx) => {
    const [invitation] = await tx
      .select({ id: invitations.id, revision: invitations.rsvpRevision })
      .from(invitations)
      .where(
        and(
          eq(invitations.token, parsed.data),
          inArray(invitations.status, ["sent", "rsvp_yes", "rsvp_no"]),
        ),
      )
      .for("update");
    if (!invitation) return "unavailable";
    const settings = await getEventSettings(tx);
    // Approved venue details are still TBD. Never substitute a development time zone.
    if (!settings.timeZone) return "not-open";
    const party = await tx
      .select({ id: guests.id, dietaryNotes: guests.dietaryNotes })
      .from(guests)
      .where(eq(guests.invitationId, invitation.id));
    if (!party.length) return "unavailable";
    const result = await saveMemberRsvp(
      tx,
      token,
      {
        expectedRevision: options?.expectedRevision ?? invitation.revision,
        requestId: options?.requestId ?? randomUUID(),
        members: party.map((person) => ({
          guestId: person.id,
          attendance: attending ? "yes" : "no",
          dietaryNotes: person.dietaryNotes ?? "",
        })),
      },
      { now: options?.now },
    );
    if (result.ok) return "saved";
    if (result.code === "locked" || result.code === "not-open") return result.code;
    if (result.code === "conflict" || result.code === "request-conflict") return "conflict";
    return "unavailable";
  });
}
