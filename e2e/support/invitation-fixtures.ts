import type { Sql } from "postgres";
import { assertDatabaseTarget } from "../../scripts/database-target";

/** IDs must belong to fixtures created by this test. Never remove append-only history. */
export async function retireInvitationFixtures(database: Sql, ids: string[]) {
  if (!ids.length) return;
  assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
  await database.begin(async (tx) => {
    await tx`update invitations set status='revoked' where id in ${tx(ids)} and exists (select 1 from rsvp_changes where invitation_id=invitations.id)`;
    await tx`delete from invitations where id in ${tx(ids)} and not exists (select 1 from rsvp_changes where invitation_id=invitations.id)`;
  });
}
