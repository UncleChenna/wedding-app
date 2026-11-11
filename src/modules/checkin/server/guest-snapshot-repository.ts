import "server-only";
import { asc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import {
  admissionCounters,
  guests,
  invitations,
  rsvps,
  tables,
} from "@/modules/shared/server/db/schema";
import type { GuestSnapshotRow } from "../lib/guest-snapshot";

/** Caller supplies a repeatable-read transaction. Explicit columns exclude all contacts and tokens. */
export async function readGuestSnapshotRows(
  database: Pick<Db, "select">,
): Promise<GuestSnapshotRow[]> {
  const rows = await database
    .select({
      invitationId: invitations.id,
      tokenVersion: invitations.tokenVersion,
      status: invitations.status,
      householdName: sql<string | null>`left(${invitations.householdName}, 513)`,
      attending: rsvps.attending,
      countAttending: rsvps.countAttending,
      allowance: admissionCounters.allowance,
      admittedSoFar: admissionCounters.admittedPeople,
      tableNumber: tables.number,
    })
    .from(invitations)
    .leftJoin(rsvps, eq(rsvps.invitationId, invitations.id))
    .leftJoin(admissionCounters, eq(admissionCounters.invitationId, invitations.id))
    .leftJoin(tables, eq(tables.id, invitations.tableId))
    .orderBy(asc(invitations.id))
    .limit(10_001);
  if (rows.length > 10_000) throw new Error("Snapshot invitation limit exceeded");
  if (!rows.length) return [];
  const members = await database
    .select({
      invitationId: guests.invitationId,
      name: sql<string>`left(${guests.name}, 201)`,
      isPrimary: guests.isPrimary,
    })
    .from(guests)
    .where(
      inArray(
        guests.invitationId,
        rows.map((row) => row.invitationId),
      ),
    )
    .orderBy(asc(guests.createdAt), asc(guests.id))
    .limit(10_001);
  if (members.length > 10_000) throw new Error("Snapshot member limit exceeded");
  const grouped = new Map<string, typeof members>();
  for (const member of members) {
    const group = grouped.get(member.invitationId) ?? [];
    group.push(member);
    grouped.set(member.invitationId, group);
  }
  return rows.map((row) => {
    const group = grouped.get(row.invitationId) ?? [];
    const primary = group.filter((member) => member.isPrimary).map((member) => member.name);
    // Keep the arm's-length display label bounded even for many named invitees;
    // every member name remains available in the separate search projection.
    const label = primary.slice(0, 2).join(" & ") + (primary.length > 2 ? " & household" : "");
    return {
      invitationId: row.invitationId,
      tokenVersion: row.tokenVersion,
      status: row.status,
      attending: row.attending,
      partySize: row.allowance ?? row.countAttending ?? 0,
      admittedSoFar: row.admittedSoFar ?? 0,
      tableNumber: row.tableNumber,
      name: label || row.householdName || "Guest household",
      names: group.map((member) => member.name),
    };
  });
}
