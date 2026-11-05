# TICKET-043 audit migration review

Generated with `pnpm db:generate --name invitation-lifecycle` after the approved
base integration of develop `5747c3d62927bd8c34d71c545bba3663d3674e07`.

## Exact protected outputs

- `drizzle/0013_invitation-lifecycle.sql`
- `drizzle/meta/0013_snapshot.json`
- `drizzle/meta/_journal.json`

Authorization, if granted, is recorded in this worktree's ignored
`.harness/approved-writes.json`. Prior approval covered only unchanged develop
artifacts; it does not authorize this new migration or changed journal content.

## What changes

Adds `invitation_lifecycle_events` with a UUID key, invitation reference, operation,
authenticated actor UUID, before/after status and version, and database timestamp.
It records no invitation capability, PIN, IP, email, phone number or guest name.
A check restricts operations to revoke/reissue. Versions must be positive; revoke
keeps the version and sets revoked, while reissue increments exactly once and sets
a published status. The invitation/time index supports audit retrieval.

The invitation foreign key restricts deletion while audit records refer to it.
Application code inserts the event in the same transaction as token/status mutation,
so an audit failure must roll back the mutation. Audit records are not deleted by
this feature. There is no database trigger preventing a privileged SQL client from
editing history; this migration does not claim tamper-proof storage.

RLS is enabled with no policies, following ADR0003 and the existing server-only
storage pattern. No existing RLS policy, table or guest row changes. Snapshot
comparison confirms every pre-existing table is identical and only this table is
added. Existing migration-journal entries are unchanged.

## Verification so far

- Drizzle generation succeeds, with exactly one new table and three protected outputs.
- SQL and JSON snapshots inspected; existing table snapshots/journal entries match.
- Integrated quick checks before generation: lint/types and 211 related tests pass;
  66 opt-in skips are not database evidence.
- Four PostgreSQL tests exist for old-link rejection/new lookup, preserved RSVP,
  atomic rollback on failed audit insertion, and competing reissues. They have not
  run: earlier base migration failed under low database VM capacity.
- This SQL has not been applied to any database. No production action is requested.

## Remaining local verification and rollout

When isolated capacity is available, verify the worktree database target, apply the
migration twice, compare row/migration counts, run `pnpm db:check-rls`, and execute:

```sh
RUN_INVITATION_LIFECYCLE_DB_TESTS=1 pnpm exec vitest run scripts/__tests__/invitation-lifecycle.integration.test.ts
```

Then run the full gate and authenticated lifecycle browser journey before review.
Any approval is for isolated testing and committing the generated outputs; production
application remains separate. Deploy the additive migration before consuming code.
Application rollback can leave the table and history intact; do not drop it or
remove audit data as a rollback. Retention/anonymization must account for the
restrictive invitation reference in the separate retention workflow.
