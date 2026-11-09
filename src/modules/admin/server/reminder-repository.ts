import "server-only";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import { invitations, rsvps } from "@/modules/shared/server/db/schema";
/** Internal query; the page boundary authorizes before exposing invitation bearer links. */
export function readReminderRows(database: Pick<Db, "select">) {
  return database
    .select({
      id: invitations.id,
      token: invitations.token,
      tokenVersion: invitations.tokenVersion,
      name: sql<string>`coalesce(nullif(${invitations.householdName}, ''), (select string_agg(g.name, ' & ' order by g.created_at, g.id) from guests g where g.invitation_id = ${invitations.id} and g.is_primary), 'Our dear guest')`,
      lastSharedAt: sql<
        string | null
      >`coalesce((select max(e.created_at) from invitation_share_events e where e.invitation_id = ${invitations.id} and e.token_version = ${invitations.tokenVersion} and e.undone_at is null), ${invitations.sentAt})::text`,
    })
    .from(invitations)
    .leftJoin(rsvps, eq(rsvps.invitationId, invitations.id))
    .where(and(eq(invitations.status, "sent"), isNull(rsvps.id)))
    .orderBy(asc(invitations.sentAt), asc(invitations.id));
}
