# TICKET-024 current-base update — 2026-11-08

The approved historical integration is committed and pushed as `3d76afb2`.
Develop has since advanced to `2706b96ddd0c7fa12c2e499f302d7e21e3108fde` and owns
migrations0012–0015. Generating from this branch now would reuse0012.

## Proposed integration

Merge that exact develop commit. The read-only merge-tree preview reports one
conflict in `src/modules/shared/server/db/schema.ts`: adjacent new enum definitions.
Preserve both TICKET-024's `scanResult` and develop's `orderAlertStatus`; retain all
other merged schema fields/tables. Do not alter existing migration SQL.

Carry these protected files unchanged from develop and record their exact-path
authorization in `.worktrees/TICKET-024/.harness/approved-writes.json`:

- `drizzle/0012_request-budgets.sql`
- `drizzle/0013_fresh_doctor_faustus.sql`
- `drizzle/0014_invitation-photos.sql`
- `drizzle/0015_theme-published-tokens.sql`
- `drizzle/meta/0012_snapshot.json`
- `drizzle/meta/0013_snapshot.json`
- `drizzle/meta/0014_snapshot.json`
- `drizzle/meta/0015_snapshot.json`
- `drizzle/meta/_journal.json`
- `pnpm-lock.yaml`

Verify every inherited protected file byte-identical to the target commit. Install
with frozen lockfile, run quick verification, preserve proposal tests and commit/push.
No new dependency is proposed: the lockfile is the already merged develop version.

## Next migration work

Only after integration, generate this ticket's additive expand/backfill/guard
sequence after0015 with Drizzle. Existing reviewed proposals are
`backfill-proposal.sql` and `guards-proposal.sql`. Existing nine-test results concern
proposals in temporary schemas, not final migrations. Final SQL and exact paths
will need separate commit authorization with fresh isolated verification evidence.
This proposal does not authorize production application, resets, deleting data,
changing RLS policies, or merging the PR.
