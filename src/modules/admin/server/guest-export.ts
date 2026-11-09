import "server-only";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db, type Db } from "@/modules/shared/server/db/client";
import { guests, invitations, menuItems, rsvps, tables } from "@/modules/shared/server/db/schema";
import type { ExportInvitation } from "../lib/guest-export";

/** Internal read: the download boundary authorizes before calling this query. */
export async function readGuestExport(
  database: Pick<Db, "transaction"> = db,
): Promise<ExportInvitation[]> {
  return database.transaction(
    async (tx) => {
      const rows = await tx
        .select({
          id: invitations.id,
          householdName: invitations.householdName,
          status: invitations.status,
          tokenVersion: invitations.tokenVersion,
          side: invitations.side,
          tableId: invitations.tableId,
          tableNumber: tables.number,
          sentAt: invitations.sentAt,
          countAttending: rsvps.countAttending,
        })
        .from(invitations)
        .leftJoin(rsvps, eq(rsvps.invitationId, invitations.id))
        .leftJoin(tables, eq(tables.id, invitations.tableId))
        .orderBy(asc(invitations.createdAt), asc(invitations.id));
      const members = await tx
        .select({
          id: guests.id,
          invitationId: guests.invitationId,
          name: guests.name,
          isPrimary: guests.isPrimary,
          mealChoice: guests.mealChoice,
          mealName: menuItems.name,
          dietaryNotes: guests.dietaryNotes,
        })
        .from(guests)
        // Legacy meal text may not be a UUID; never cast it. Include unavailable menu items.
        .leftJoin(menuItems, eq(sql<string>`${menuItems.id}::text`, guests.mealChoice))
        .orderBy(desc(guests.isPrimary), asc(guests.createdAt), asc(guests.id));
      const grouped = new Map<string, ExportInvitation["guests"]>();
      for (const member of members) {
        const household = grouped.get(member.invitationId) ?? [];
        household.push({
          id: member.id,
          name: member.name,
          isPrimary: member.isPrimary,
          meal: member.mealName ?? member.mealChoice ?? "",
          dietaryNotes: member.dietaryNotes ?? "",
        });
        grouped.set(member.invitationId, household);
      }
      return rows.map((row) => {
        const guests = grouped.get(row.id) ?? [];
        return {
          id: row.id,
          name:
            row.householdName ||
            guests.map((guest) => guest.name).join(" & ") ||
            "Unnamed invitation",
          status: row.status,
          tokenVersion: row.tokenVersion,
          guests,
          countAttending: row.countAttending,
          side: row.side,
          tableId: row.tableId,
          tableNumber: row.tableNumber,
          sentAt: row.sentAt?.toISOString() ?? null,
        };
      });
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
}
