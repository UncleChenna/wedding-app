import "server-only";
import { and, count, eq, inArray } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import { guests, invitations, rsvps } from "@/modules/shared/server/db/schema";
import { getEventSettings } from "@/modules/shared/server/settings";
import { invitationTokenSchema } from "../lib/token";
import type { SaveRsvpResult } from "./submit-rsvp";

/** Token capability is checked again inside the transaction; a rendered form is not authorization. */
export async function saveRsvp(
  database: Pick<Db, "transaction">,
  token: string,
  attending: boolean,
): Promise<SaveRsvpResult> {
  const parsed = invitationTokenSchema.safeParse(token);
  if (!parsed.success) return "unavailable";
  return database.transaction(async (tx) => {
    const [invitation] = await tx
      .select({ id: invitations.id })
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
    const [party] = await tx
      .select({ count: count() })
      .from(guests)
      .where(eq(guests.invitationId, invitation.id));
    const countAttending = attending ? Math.max(1, party?.count ?? 0) : 0;
    const now = new Date();
    await tx
      .insert(rsvps)
      .values({ invitationId: invitation.id, attending, countAttending, respondedAt: now })
      .onConflictDoUpdate({
        target: rsvps.invitationId,
        set: { attending, countAttending, respondedAt: now, updatedAt: now },
      });
    await tx
      .update(invitations)
      .set({ status: attending ? "rsvp_yes" : "rsvp_no", updatedAt: now })
      .where(eq(invitations.id, invitation.id));
    return "saved";
  });
}
