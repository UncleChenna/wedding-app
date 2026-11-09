import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import { invitations } from "@/modules/shared/server/db/schema";

/** Only called after admin authorization; returned links are private household credentials. */
export function readPassReminderRows(database: Pick<Db, "select">) {
  return database
    .select({
      id: invitations.id,
      token: invitations.token,
      tokenVersion: invitations.tokenVersion,
      name: sql<string>`coalesce(nullif(${invitations.householdName}, ''), (select string_agg(g.name, ' & ' order by g.created_at, g.id) from guests g where g.invitation_id = ${invitations.id} and g.is_primary), 'Our dear guest')`,
    })
    .from(invitations)
    .where(eq(invitations.status, "rsvp_yes"))
    .orderBy(asc(invitations.householdName), asc(invitations.id));
}
