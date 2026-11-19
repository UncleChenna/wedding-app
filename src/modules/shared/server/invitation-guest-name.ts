import "server-only";
import { sql } from "drizzle-orm";
import { invitations } from "./db/schema";

/** Guest names identify an invitation; legacy guest labels are not read. */
export function invitationGuestName() {
  return sql<string>`coalesce((select string_agg(g.name, ' & ' order by g.created_at, g.id)
    from guests g where g.invitation_id = ${invitations.id} and g.is_primary), 'Guest')`;
}
