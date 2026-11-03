import "server-only";
import { rsvpWindow } from "../lib/rsvp-window";
import { readRsvpSnapshot, recordRsvpChange } from "./rsvp-history";
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
  clock: () => Date = () => new Date(),
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
    const now = clock();
    const window = rsvpWindow(settings, now);
    if (window !== "open") return window;
    const before = await readRsvpSnapshot(tx, invitation.id);
    const [party] = await tx
      .select({ count: count() })
      .from(guests)
      .where(eq(guests.invitationId, invitation.id));
    const countAttending = attending ? Math.max(1, party?.count ?? 0) : 0;
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
    await recordRsvpChange(tx, invitation.id, before, now);
    return "saved";
  });
}
