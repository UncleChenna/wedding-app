import { invitationGuestName } from "@/modules/shared/server/invitation-guest-name";
import "server-only";
import { asc, eq } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import { invitations } from "@/modules/shared/server/db/schema";

/** Only called after admin authorization; returned links are private household credentials. */
export function readPassReminderRows(database: Pick<Db, "select">) {
  return database
    .select({
      id: invitations.id,
      token: invitations.token,
      tokenVersion: invitations.tokenVersion,
      name: invitationGuestName(),
    })
    .from(invitations)
    .where(eq(invitations.status, "rsvp_yes"))
    .orderBy(asc(invitations.createdAt), asc(invitations.id));
}
