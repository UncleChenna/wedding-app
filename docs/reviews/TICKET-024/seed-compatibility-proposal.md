# TICKET-024 local-seed compatibility proposal — 2026-11-08

CI job128786229638 in run42498600206 fails after migration, inside the existing
`pnpm db:seed` reset. Its TRUNCATE CASCADE reaches the new admission tables and
correctly raises `Admission evidence is append-only`. No migration failed.

## Proposed repair

Keep all applied migration SQL and normal admission guards unchanged. Extend only
`scripts/seed.ts`'s existing explicitly local transaction (which already temporarily
disables rsvp_history_append_only) to handle the admission reset consistently:

1. Retain `assertDatabaseTarget(..., { localOnly: true })` before any database write.
2. In the same transaction as the existing synthetic-data reset, temporarily disable
   these exact guards: scan_events_append_only on scan_events;
   admission_counters_no_removal on admission_counters;
   rsvp_admission_no_truncate on rsvps; guest_admission_no_truncate on guests.
3. Explicitly include scan_events and admission_counters in the local reset table
   list. Preserve existing reset semantics for the other seed tables.
4. Immediately restore those four guards before inserting seed fixtures; transaction
   rollback must also restore their state if reset or insertion fails. Never use
   session_replication_role, DISABLE TRIGGER ALL or remove a trigger from migrations.
5. Add isolated database regressions for two deterministic seed runs, counts and
   enabled guards afterward, failed-reset rollback and append-only rejection after
   seed. Re-run the CI-equivalent seed sequence and full verification.

This is a narrowly scoped local reset capability, not a change to runtime admission
behavior. It cannot run against remote production targets. Do not weaken CI or tests.

## Permission requested

Approve this repair plus executing the existing seed reset only in TICKET-024's
isolated database after reconfirming it contains exclusively synthetic test data.
The last recorded count is zero rows in every public table. The second seed run
would delete/recreate only the first run's synthetic fixtures. No production reset,
other collaborator stack, RLS-policy change, applied migration edit or PR merge.

The earlier approval explicitly excluded resets/data deletion, so these seed runs
have not been attempted locally. New regression tests and the proposed repair are
not implemented or claimed passing yet. Nine final-file migration tests, five
applied-schema tests, repeat migration/RLS and the general full gate already pass.
The ticket cannot be completed while CI's seed gate fails.
