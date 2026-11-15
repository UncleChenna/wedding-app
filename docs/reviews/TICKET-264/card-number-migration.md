# Permanent invitation card numbers

The additive migration `0039_invitation-card-number.sql` adds an integer
`card_number` generated ALWAYS by a PostgreSQL identity sequence, with unique and
positive constraints. Existing invitations receive a number during migration.
There is no promise that this initial allocation follows invitation creation date.

`invitations.cardNumber` is a required `number` when selecting a complete row;
callers omit it when inserting. Display code should pad to a minimum of three
digits (`001`), without truncating numbers of four or more digits. The database
stores integers, not formatted labels. Numbers are not bearer credentials.

Sequence gaps are intentional: deleting an invitation or rolling back an insert
does not recycle numbers. Updating its token/version leaves its number unchanged.
Do not reset the sequence, assign `DEFAULT` to an existing card number, or use an
identity override in application code. Privileged database maintenance can still
change identity values; this migration does not add an immutability trigger.

## Isolated verification — 15 November 2026

- Initialized a new owned native PostgreSQL 16 cluster at
  `/tmp/TICKET-264-card-postgres/data`, loopback port `36461`, with matching ignored
  worktree target metadata. No other stack was changed.
- Applied the existing full history through 0038; inserted two synthetic existing
  invitations. Four new regression tests failed because `card_number` was absent.
- Generated SQL using `pnpm db:generate --name invitation-card-number`; inspected
  the three additive statements. No existing migration, policy or row was edited.
- Applied the generated migration using `pnpm exec drizzle-kit migrate` directly.
  The normal wrapper starts Supabase; this explicitly isolated native PostgreSQL
  test used the same checked Drizzle configuration without starting another stack.
- Both existing synthetic invitations retained their IDs, household names and
  tokens, with distinct backfilled numbers 1 and 2.
- Ran migration again: `pnpm db:counts` outputs matched byte-for-byte, including
  all row counts and applied migration count (40).
- `RUN_CARD_NUMBER_DB_TESTS=1 pnpm exec vitest run
scripts/__tests__/invitation-card-number.integration.test.ts`: **4 passed**.
  Checks cover concurrent distinct positive allocation, stable numbers after token
  reissue and deletion, refusal of caller-supplied identity values, and unique /
  positive checks even with privileged identity overrides.
- `pnpm db:check-rls`: **all 30 public tables retain RLS**.

All fixtures were synthetic. This was not a production migration or a populated
real-guest rehearsal. No reset was needed. Existing seed inserts omit this new
field and use the identity default; seed/reset behavior was not rerun here.
Full application verification and printed formatting belong to the integrating
card implementation, and are not certified by these database-only checks.

## Deployment and rollback considerations

Adding an identity column and unique constraint takes a table lock and assigns
numbers to existing rows; schedule appropriately before printing real cards.
Deploy the additive migration before code that selects the new field. For an
application rollback, retain the column and sequence: dropping/recreating them
could invalidate already printed numbers. Restoring a database backup must also
restore its identity sequence state. No destructive rollback SQL is proposed.
