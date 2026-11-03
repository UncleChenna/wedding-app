# TICKET-031 migration review

Generated with `pnpm db:generate --name staff-pin-attempts` on 2026-11-03.

Exact protected outputs awaiting commit authorization:

- `drizzle/0011_staff-pin-attempts.sql`
- `drizzle/meta/0011_snapshot.json`
- `drizzle/meta/_journal.json`

Adds only `staff_pin_attempts`: opaque 64-hex device ID, failures (0–5) and
window start. RLS is enabled without granting client policies. Existing tables,
credentials and data are unchanged. The source proposal is in
`src/modules/shared/server/db/schema.ts`.

The table supports transactional row locking across server instances. Eight
simultaneous wrong attempts execute only five verifications; the fifth failure
and later attempts return locked. Expired windows reset, and successful sign-in
clears failures. No PIN, hash, IP address or guest data enters this table.

Isolated stack: wedding-5f49479b1ba7, database port 27861. The constraint test
failed for the missing table before generation/application. Both database tests
now pass, covering constraints, RLS, concurrency, expiry and successful reset.
No production database application is requested. Before release, run the full
authentication journey and verification gate; this is not ticket completion.

Rollback: revert the application use before considering removal of this additive
table. Dropping the table loses lockout counters; it is not an automatic rollback.
Existing applied migrations remain untouched. The authorization record, if
approved, belongs at `.worktrees/TICKET-031/.harness/approved-writes.json`.
