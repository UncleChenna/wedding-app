# TICKET-066 migration review

Migration `0031_offline-intent-digest.sql` adds a nullable SHA-256 intent digest to
`scan_events`. New offline uploads bind the original invitation ID (including an
unknown ID), pass version, authenticated original actor/device, timestamp,
reported result/count, kind and input method. Reusing a UUID with another payload
is rejected without changing canonical admission counts. Online events cannot
carry this field; the check constraint permits only lowercase 64-character hex.

The previous comparison could not distinguish changed pass versions or two
unknown invitation IDs. The new regression failed before the fix and passed
with the generated migration. Historical NULL-digest rows retain the older
comparison: their missing original fields cannot be reconstructed honestly.
Existing append-only evidence is not rewritten. Deploy the migration before the
new server code. Rolling back application code can leave the nullable column in
place; do not drop or mutate historical evidence to roll back this release.

Isolated native PostgreSQL on TICKET-066's reserved port 29341 only:

- 13 reconciliation database tests pass, including changed-version/unknown-ID
  replay, exact retry, concurrency and session-expiry behavior.
- Two migrations produce identical table/migration counts.
- All 26 public tables retain RLS.
- Default and load deterministic seeds each run twice; both complete-table hash
  comparisons pass, including restored append-only guards (2 tests).

The database was created empty for this ticket and contains synthetic fixtures
only. No production or collaborator database was changed. Generated SQL and
snapshot were produced through Drizzle after integrating develop `af819983`.
