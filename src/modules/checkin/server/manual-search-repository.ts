import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import { guests, invitations } from "@/modules/shared/server/db/schema";
import { manualHouseholdName, searchGuestNames } from "../lib/manual-search";

/** Authenticated callers only. No contact, meal, dietary, invitation-token or note columns. */
export async function searchManualGuests(database: Pick<Db, "select">, query: string) {
  const rows = await database
    .select({
      invitationId: invitations.id,
      householdName: invitations.householdName,
      name: guests.name,
      isPrimary: guests.isPrimary,
    })
    .from(invitations)
    .leftJoin(guests, eq(guests.invitationId, invitations.id))
    .orderBy(asc(invitations.id), desc(guests.isPrimary), asc(guests.createdAt), asc(guests.id))
    .limit(10001);
  if (rows.length > 10000) throw new Error("Manual search capacity exceeded");
  const groups = new Map<
    string,
    { invitationId: string; householdName: string | null; primary: string[]; names: string[] }
  >();
  for (const row of rows) {
    const group = groups.get(row.invitationId) ?? {
      invitationId: row.invitationId,
      householdName: row.householdName,
      primary: [],
      names: [],
    };
    if (row.name) {
      group.names.push(row.name);
      if (row.isPrimary) group.primary.push(row.name);
    }
    groups.set(row.invitationId, group);
  }
  return searchGuestNames(
    [...groups.values()].map((group) => ({
      invitationId: group.invitationId,
      name: manualHouseholdName(group.primary, group.householdName),
      names: group.names,
    })),
    query,
  );
}
