# TICKET-024 migration verification — 2026-11-08

Base: develop `2706b96ddd0c7fa12c2e499f302d7e21e3108fde`.
Target: owned isolated Supabase project `wedding-87b768edd6c7`; target guard passed.
No production application, reset, existing-data deletion or other stack operation.

## Generated artifacts

Drizzle generated0016_admission-expand and the0017/0018 custom scaffolds/snapshots.
The custom files contain the reviewed backfill and guard proposals, populated
before first application. Existing0000–0015 migrations were not modified.
The user approved generation, isolated testing, commit and the exact-path record.

## Actual checks

- `RUN_ADMISSION_DB_TESTS=1 ADMISSION_SCHEMA_PROPOSAL=1 pnpm exec vitest run scripts/__tests__/admission-storage.integration.test.ts --maxWorkers=1`: nine passed against final generated files. The historical environment-variable name now selects isolated-schema execution of final migrations, not proposal SQL. Includes all five results, retry identity, RLS, immutable evidence, invalid counts/actors, authoritative allowance, populated current/bootstrap preservation and concurrent final admission.
- The first invocation omitted temporary-schema mode before public migration: five failed for absent tables and four skipped. No assertions changed. Temporary-schema mode then passed all nine.
- Before application:14 public tables, all empty;11 migrations already applied. This is not evidence for upgrading a populated real deployment.
- `pnpm db:migrate` twice: both succeeded;19 migrations applied. Both post-run `pnpm db:counts` outputs match exactly;20 tables remain empty.
- `pnpm db:check-rls`: all20 public tables have RLS.
- Applied public-schema test mode: five passed, four intentionally skipped (populated preservation/concurrency fixtures execute in isolated-schema mode above).
- `pnpm verify:quick`: lint/types pass; the opt-in database suite skips by default and was run explicitly above.
- Full `pnpm verify`: passed lint, types,1089 unit tests (116 skipped), production build and837 browser smoke tests (189 skipped), terminal exit0.

Logs are `/tmp/TICKET-024-generated-schema-tests.log`,
`/tmp/TICKET-024-migrate-{first,second}.log`, `/tmp/TICKET-024-counts-{before,first,second}.txt`,
`/tmp/TICKET-024-rls.log`, `/tmp/TICKET-024-applied-tests.log`,
`/tmp/TICKET-024-final-{quick,verify}.log`.

## Deployment and rollback boundaries

Do not apply0001 to a populated pre0001 database: it remains empty-scaffold-only.
Legacy preservation is verified with direct bootstrap fixtures, not certified as
a complete production upgrade path. The legacy check_ins archive remains intact.
The new guard triggers intentionally reject deletion/truncation of admission evidence
and reductions below accepted admissions. Consumer transactions lock invitation,
RSVP and counter consistently; reconciliation allocates canonical seats before
inserting conflicting physical reports and must not increment counters twice.

No destructive down migration is supplied. Roll back application code while retaining
the additive archive/counters; any schema rollback or retention deletion needs a
separate reviewed migration and data-preservation plan. No PR merge is authorized.

## Approved local-seed repair — 2026-11-08

User approved the named-trigger local seed repair and synthetic-only reset tests.
Before reset, all guest/admission tables were empty; only one test request-budget
row existed. The helper is called inside seed.ts's existing transaction after
local-target validation. It disables only the existing RSVP-history guard and four
approved admission/source guards, resets the named seed tables, and re-enables all
five before inserting fixtures. Applied migrations and runtime guards are unchanged.

- Regression first failed for the missing helper; implementation then passed.
- Both `pnpm db:seed` runs succeed. Post-run counts match exactly:110 invitations,
  248 guests,28 tables,16 menu items,18 orders and30 historical check-ins.
- RLS remains enabled on all20 public tables.
- Post-seed public-schema tests:5passed/5fixture-only skips; they assert all five
  guards enabled and reject evidence mutation.
- Temporary-schema suite:10passed, including rollback after a synthetic failure
  while guards are disabled, preservation of prior evidence on failure, successful
  reset, enabled guards afterward and rejection of subsequent evidence deletion.
- Quick verification passes. Full verification of the repair is running; no final
  result or passing replacement CI claim yet.

Logs: `/tmp/TICKET-024-seed-{first,second}.log`,
`/tmp/TICKET-024-seed-counts-{first,second}.txt`, `/tmp/TICKET-024-seed-rls.log`,
`/tmp/TICKET-024-after-seed-tests.log`, `/tmp/TICKET-024-final-seed-regression.log`,
`/tmp/TICKET-024-seed-{quick,full}.log`. No other database was reset.
