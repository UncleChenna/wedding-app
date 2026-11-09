import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/modules/shared/server/db/client";
import { guests, invitations, rsvps, tables } from "@/modules/shared/server/db/schema";
import { getEventSettings } from "@/modules/shared/server/settings";
import { clientEnv } from "@/modules/shared/lib/env/client";
import { createLogger } from "@/modules/shared/lib/logger";
import type { GuestListInvitation } from "../lib/guest-list";
import { prepareSharingInvitation } from "../lib/sharing-invitation";
import { requireAdminPageAccess } from "./current-admin-access";

const log = createLogger({ module: "admin-guest-list" });
export type GuestListResult =
  { ok: true; invitations: GuestListInvitation[] } | { ok: false; message: string };

/** Authorize before any database/settings read, including RSC navigation requests. */
export async function getGuestList(): Promise<GuestListResult> {
  await requireAdminPageAccess();
  try {
    const [settings, rows, members] = await Promise.all([
      getEventSettings(),
      db
        .select({
          id: invitations.id,
          token: invitations.token,
          tokenVersion: invitations.tokenVersion,
          status: invitations.status,
          householdName: invitations.householdName,
          side: invitations.side,
          tableId: invitations.tableId,
          tableNumber: tables.number,
          sentAt: invitations.sentAt,
          countAttending: rsvps.countAttending,
        })
        .from(invitations)
        .leftJoin(rsvps, eq(rsvps.invitationId, invitations.id))
        .leftJoin(tables, eq(tables.id, invitations.tableId))
        .orderBy(asc(invitations.createdAt), asc(invitations.id)),
      // A separate ordered query prevents households being duplicated by members.
      db
        .select({ id: guests.id, invitationId: guests.invitationId, name: guests.name })
        .from(guests)
        .orderBy(desc(guests.isPrimary), asc(guests.createdAt), asc(guests.id)),
    ]);
    const grouped = new Map<string, { id: string; name: string }[]>();
    for (const member of members) {
      const household = grouped.get(member.invitationId) ?? [];
      household.push({ id: member.id, name: member.name });
      grouped.set(member.invitationId, household);
    }
    return {
      ok: true,
      invitations: rows.map((row) => {
        const members = grouped.get(row.id) ?? [];
        const name =
          row.householdName ||
          members.map((member) => member.name).join(" & ") ||
          "Unnamed invitation";
        const sharing = prepareSharingInvitation(
          { ...row, name },
          settings,
          clientEnv.NEXT_PUBLIC_SITE_URL,
        );
        return {
          id: row.id,
          name,
          status: row.status,
          tokenVersion: row.tokenVersion,
          guests: members,
          countAttending: row.countAttending,
          side: row.side,
          tableId: row.tableId,
          tableNumber: row.tableNumber,
          sentAt: row.sentAt?.toISOString() ?? null,
          share: sharing.share,
          guidance: sharing.guidance,
        };
      }),
    };
  } catch {
    // No names, contacts, tokens or database messages enter logs or error responses.
    log.warn("Guest list unavailable");
    return { ok: false, message: "Your guest list couldn't load. Please try again shortly." };
  }
}
