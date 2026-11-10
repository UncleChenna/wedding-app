# Scan resolution audit storage

The new `scan_resolution_notes` table stores only event ID, unique request ID,
server-derived admin UUID, an allowlisted resolution code and server timestamp.
Its event foreign key restricts deletion. RLS is enabled with no browser policies.

Generate the table migration after TICKET-062 lands, then a Drizzle custom migration
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

Verification pending: final generated SQL review, twice-applied migrations/counts,
RLS for all tables, filter/privacy/immutability/concurrent-retry tests, seed
repeatability and the authenticated browser journey. The initial four integration
tests failed against the untouched base database because the new table and
TICKET-062 input-method column do not exist yet. This establishes the red baseline.

Rollback: roll back application code while retaining the additive audit table and
guard. Do not delete evidence or reverse applied migrations to undo this feature.
