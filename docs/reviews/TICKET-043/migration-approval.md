# TICKET-043 audit migration review

Generated with `pnpm db:generate --name invitation-lifecycle` after the approved
base integration of develop `5747c3d62927bd8c34d71c545bba3663d3674e07`.

## Exact protected outputs

- `drizzle/0013_invitation-lifecycle.sql`
- `drizzle/meta/0013_snapshot.json`
- `drizzle/meta/_journal.json`

The owner explicitly approved these outputs for isolated testing, commit and
recording authorization on 2026-11-05. That authorization is recorded in this
worktree's ignored `.harness/approved-writes.json`. Production application remains
unauthorized.

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

## Verification

- Drizzle generation succeeds; existing table snapshots and journal entries are unchanged.
- Started only PostgreSQL in managed project `wedding-bf77f6b10d5f`, keeping health checks
  enabled and all other collaborators' stacks untouched. No target guard was bypassed.
- Migration applied twice; all row counts and the 14-entry migration count are identical.
- RLS enabled on all 17 public tables.
- All four real PostgreSQL lifecycle tests pass: token rotation/lookup and audit identity,
  revocation preserving RSVP, rollback when audit insertion fails, and concurrent reissue.
- First test run found an incorrect expected DTO type in the test (`true` versus the
  existing public `"yes"` contract). Corrected that assertion and reran all four successfully.
- Seed applied twice with identical counts; all 17 tables still have RLS enabled.
- No reset or production application was performed. The reduced service set does not
  certify Auth, Realtime or authenticated browser journeys.

## Remaining local verification and rollout

To repeat the lifecycle database checks against this verified isolated target:

```sh
RUN_INVITATION_LIFECYCLE_DB_TESTS=1 pnpm exec vitest run scripts/__tests__/invitation-lifecycle.integration.test.ts
```

Then run the full gate and authenticated lifecycle browser journey before review.
The granted approval covers isolated testing and committing the generated outputs;
production application remains separate. Deploy the additive migration before consuming code.
Application rollback can leave the table and history intact; do not drop it or
remove audit data as a rollback. Retention/anonymization must account for the
restrictive invitation reference in the separate retention workflow.
