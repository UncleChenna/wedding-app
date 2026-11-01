import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/modules/shared/server/db/client";
import { invitations, guests } from "@/modules/shared/server/db/schema";
import { getEventSettings } from "@/modules/shared/server/settings";
import { clientEnv } from "@/modules/shared/lib/env/client";
import { requireAdminPageAccess } from "./current-admin-access";
import { prepareSharingInvitation } from "../lib/sharing-invitation";

/** Authorize here as well as in the layout: invitation URLs are bearer credentials. */
export async function getSharingInvitations() {
  await requireAdminPageAccess();
  const settings = await getEventSettings();
  const rows = await db
    .select({
      id: invitations.id,
      token: invitations.token,
      status: invitations.status,
      householdName: invitations.householdName,
    })
    .from(invitations)
    .orderBy(asc(invitations.createdAt), asc(invitations.id));
  const names = await db
    .select({ invitationId: guests.invitationId, name: guests.name })
    .from(guests)
    .where(eq(guests.isPrimary, true))
    .orderBy(asc(guests.createdAt), asc(guests.id));
  const grouped = new Map<string, string[]>();
  for (const guest of names) {
    const existing = grouped.get(guest.invitationId) ?? [];
    existing.push(guest.name);
    grouped.set(guest.invitationId, existing);
  }
  return rows.map((row) =>
    prepareSharingInvitation(
      {
        ...row,
        name: row.householdName || grouped.get(row.id)?.join(" & ") || "Our dear guest",
      },
      settings,
      clientEnv.NEXT_PUBLIC_SITE_URL,
    ),
  );
}
