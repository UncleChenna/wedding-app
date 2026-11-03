import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import type { Db } from "@/modules/shared/server/db/client";
import { guests, invitations, rsvps, tables } from "@/modules/shared/server/db/schema";

import type { StoredPass } from "../lib/pass-eligibility";

type PassDb = Pick<Db, "select">;

/** Current state for one signed pass; reads no contact details, notes or dietary data. */
export async function findStoredPass(
  db: PassDb,
  invitationId: unknown,
): Promise<StoredPass | null> {
  const id = z.uuid().safeParse(invitationId);
  if (!id.success) return null;
  const rows = await db
    .select({
      status: invitations.status,
      tokenVersion: invitations.tokenVersion,
      householdName: invitations.householdName,
      tableNumber: tables.number,
      attending: rsvps.attending,
      countAttending: rsvps.countAttending,
      name: guests.name,
    })
    .from(invitations)
    .leftJoin(rsvps, eq(rsvps.invitationId, invitations.id))
    .leftJoin(tables, eq(tables.id, invitations.tableId))
    .leftJoin(guests, and(eq(guests.invitationId, invitations.id), eq(guests.isPrimary, true)))
    .where(eq(invitations.id, id.data))
    .orderBy(asc(guests.createdAt), asc(guests.id));
  const first = rows[0];
  if (!first) return null;
  return {
    status: first.status,
    tokenVersion: first.tokenVersion,
    householdName: first.householdName,
    tableNumber: first.tableNumber,
    attending: first.attending,
    countAttending: first.countAttending ?? 0,
    primaryNames: rows.flatMap((row) => (row.name === null ? [] : [row.name])),
  };
}
