# Scan resolution audit storage

The new `scan_resolution_notes` table stores only event ID, unique request ID,
server-derived admin UUID, an allowlisted resolution code and server timestamp.
Its event foreign key restricts deletion. RLS is enabled with no browser policies.

Generated the table migration after TICKET-062 landed, then a Drizzle custom migration
that installs `scan_resolution_notes_append_only` for UPDATE, DELETE and TRUNCATE,
using the existing `reject_admission_evidence_mutation` trigger function. Do not edit
any migration already on develop. The application has no update/delete note path.

This leaves all scan evidence and canonical admission counts untouched. Retrying the
same request returns success only when event, admin and resolution all match. A
different payload using the same request identity is rejected.

The explicitly local-only synthetic seed reset disables this one additional named
guard in its existing transaction and re-enables it before fixture insertion. Tests
must prove rollback restores the guard and evidence, successful reset restores the
guard, and direct note mutations still fail. This exception never runs in product
request code or against production data.

Generated paths: `drizzle/0028_scan-resolution-notes.sql`,
`drizzle/0029_scan-resolution-guards.sql`, their generated snapshots and the journal.
Independent SQL/seed review found no blocker. Both migrations applied twice with
identical counts (30 total migrations, initially empty public tables). All 25 public
tables retain RLS. Seven filter/privacy/immutability/concurrent-retry tests pass;
twelve seed/admission tests pass. The original four integration tests failed against
the untouched base because the new table and TICKET-062 input-method column were
absent, establishing the red baseline. Authenticated browser and final CI remain pending.

Local commands used `DATABASE_URL` pointing only to the managed reserved port 31101,
validated by the existing target guard. `pnpm exec drizzle-kit migrate` invokes the
same migrator without starting an unnecessary full Supabase stack. `pnpm db:counts`
was compared after each run and `pnpm db:check-rls` passed. Conditional suites used
`RUN_SCAN_LOG_DB_TESTS=1`, then `RUN_SEED_DB_TESTS=1 RUN_ADMISSION_DB_TESTS=1
ADMISSION_SCHEMA_PROPOSAL=1`. The native database is stopped, with synthetic data retained.

Rollback: roll back application code while retaining the additive audit table and
guard. Do not delete evidence or reverse applied migrations to undo this feature.

The commit classifier flags UPDATE/DELETE/TRUNCATE words inside the guard's trigger
definition as destructive SQL. Under the user's explicit standing authorization for
repository changes and decisions, the ignored exact-path approval record lists only
`drizzle/0029_scan-resolution-guards.sql`. Independent review and isolated tests prove
that this CREATE TRIGGER prevents mutations; it does not perform them. The hook stays
enabled. This record does not claim a new per-file user reply or production application.
