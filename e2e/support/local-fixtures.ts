import { existsSync } from "node:fs";
import type { Sql } from "postgres";
import { assertDatabaseTarget } from "../../scripts/database-target";

/** Delete only explicitly supplied synthetic invitations in this managed local test stack. */
export async function removeInvitationFixtures(db: Sql, ids: string[]) {
  if (!ids.length) return;
  if (!existsSync(".harness/worktree.json")) throw new Error("Managed fixture stack required");
  assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
  await db.begin(async (tx) => {
    // Production history stays append-only. Test-only teardown disables its trigger
    // within one transaction and targets only IDs created by the calling suite.
    await tx`alter table rsvp_changes disable trigger rsvp_history_append_only`;
    await tx`delete from rsvp_changes where invitation_id in ${tx(ids)}`;
    await tx`delete from invitations where id in ${tx(ids)}`;
    await tx`alter table rsvp_changes enable trigger rsvp_history_append_only`;
  });
}
