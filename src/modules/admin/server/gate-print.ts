import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/modules/shared/server/db/client";
import {
  admissionCounters,
  guests,
  invitations,
  rsvps,
  tables,
} from "@/modules/shared/server/db/schema";
import { createLogger } from "@/modules/shared/lib/logger";
import { buildGatePrintRows, type GatePrintRow } from "@/modules/checkin/lib/gate-print";
import { requireAdminPageAccess } from "./current-admin-access";

export type GatePrintResult =
  { ok: true; rows: GatePrintRow[]; exportedAt: string } | { ok: false; message: string };
export async function getGatePrintList(): Promise<GatePrintResult> {
  await requireAdminPageAccess();
  try {
    return await db.transaction(
      async (tx) => {
        const rows = await tx
          .select({
            id: invitations.id,
            householdName: invitations.householdName,
            status: invitations.status,
            countAttending: rsvps.countAttending,
            tableNumber: tables.number,
            admittedPeople: admissionCounters.admittedPeople,
          })
          .from(invitations)
          .leftJoin(rsvps, eq(rsvps.invitationId, invitations.id))
          .leftJoin(tables, eq(tables.id, invitations.tableId))
          .leftJoin(admissionCounters, eq(admissionCounters.invitationId, invitations.id))
          .where(eq(invitations.status, "rsvp_yes"));
        const members = await tx
          .select({
            invitationId: guests.invitationId,
            name: guests.name,
            isPrimary: guests.isPrimary,
          })
          .from(guests)
          .innerJoin(invitations, eq(invitations.id, guests.invitationId))
          .where(eq(invitations.status, "rsvp_yes"))
          .orderBy(desc(guests.isPrimary), asc(guests.createdAt), asc(guests.id));
        const grouped = new Map<string, { name: string; isPrimary: boolean }[]>();
        for (const member of members) {
          const group = grouped.get(member.invitationId) ?? [];
          group.push({ name: member.name, isPrimary: member.isPrimary });
          grouped.set(member.invitationId, group);
        }
        return {
          ok: true,
          rows: buildGatePrintRows(
            rows.map((row) => ({ ...row, guests: grouped.get(row.id) ?? [] })),
          ),
          exportedAt: new Date().toISOString(),
        };
      },
      { isolationLevel: "repeatable read", accessMode: "read only" },
    );
  } catch {
    createLogger({ module: "gate-print" }).warn("Printable guest list unavailable");
    return { ok: false, message: "The gate list couldn't load. Please try again before printing." };
  }
}
