# TICKET-172 — 2026-10-27

Owner divine; agent codex; branch TICKET-172; base 3752e0591e225a0dd4421c84c225917dca270e29. Managed project wedding-c7cedc939c2c, DB23001, app23010, PW23011.

## Prepared

Source schema adds unprovisioned/encoded PIN lifecycle fields and device registration table; seed data explicitly has no usable/default PIN and maps seeded scan IDs to three named devices. Five opt-in SQL constraint tests and two seed regressions added. Exact migration proposal: docs/reviews/TICKET-172/migration-approval.md. No generated migrations or database changes.

## Evidence

RUN_STAFF_DB_TESTS=1 pnpm test scripts/**tests**/staff-devices.integration.test.ts: five expected failures against missing old columns/table. pnpm verify:quick passes lint/types/related tests (DB cases skipped). Seven seed unit tests pass. pnpm db:counts shows all ten tables empty, two applied migrations. Full gate and migrated DB verification not run.

Draft PR: https://github.com/UncleChenna/wedding-app/pull/47. Source/proposal pushed in a9c5363. Exact-path approval requested; awaiting actual user reply.

## Next action

Obtain explicit approval for drizzle/0002_staff-device-identities.sql, drizzle/meta/0002_snapshot.json, drizzle/meta/_journal.json and recording it in this worktree's ignored .harness/approved-writes.json. Do not generate or apply equivalent SQL before approval. Then generate through Drizzle, inspect SQL, test empty and existing bootstrap preservation, migrate twice/counts, all new and existing DB regressions, RLS, seed repeatability, full gate. The five DB failures must turn green before completion.

TICKET-025 has conflicting pending idx1 migration numbering: whichever lands second needs regeneration and fresh exact-path approval. No assumption of production authorization. No PIN login implemented (TICKET-031), no check-in conversion (TICKET-024), no UI work. The boilerplate audit wording in the old ticket is interpreted as referring to the prior audit task, not prohibiting this explicitly requested implementation.

TICKET-050 is done: PR46 merged 3752e05 after exact-head CI40430768846 passed all jobs. Its isolated stack was stopped with backup retained. Preserve unclechenna's TICKET-204 work.

## 2026-11-03 proposal refresh

Read-only preview against develop f5e5db58446363c6a0b4998dea3dbdfa603a43c1 has two seed-file conflicts; schema merges cleanly. No source integration, migration generation or database mutation performed. Updated migration-approval.md supersedes old 0002 paths with 0009 outputs and lists 17 unchanged protected develop files, verified byte-identical in the preview. Await explicit authorization to record exact paths and generate/test/commit locally. The original database red tests remain historical, not verification against current develop. After approval, integrate the seed changes, regenerate from idx8, and prove preservation and constraints before review. TICKET-015 remains paused.

## 2026-11-03 authorized integration and database finding

User approved 0009 generation, isolated testing, commit and authorization record, including unchanged develop files. Recorded approval, resumed through CLI, integrated develop 0e6247c630c4d8962eb01b3c8bc2ef0817268e47 with both ordering and staff/device seed contracts retained. Colima was stopped; started existing runtime and only this ticket's Supabase stack.

Generated and applied 0009 through Drizzle. Eleven seed tests pass. Five constraint tests failed before migration as expected. After migration, six of seven database tests pass, including two new rollback-only empty/bootstrap preservation tests. The remaining failure is a real PostgreSQL regex error: repetition bound {64,256} exceeds its supported bound. Migration runs twice with identical all-zero public row counts and ten journal entries; RLS passes all 14 tables. No production changes.

Proposed correction in schema.ts replaces digest [0-9a-f]{64,256} with ([0-9a-f]{2}){32,128}. Preserve applied 0009; generate 0010_staff-pin-envelope-fix.sql and 0010_snapshot.json, updating journal through Drizzle. Automatic approval review rejected the attempted correction/authorization because previous approval explicitly covered 0009 only; command did not execute. Pending user approval covers the schema correction, exact 0010 outputs, journal and authorization record. Full verify and seed repeatability remain outstanding. Do not claim migration completion.

User audit reports PR81 and PR82 merged; reconcile TICKET042 via CLI after this task. Historical TICKET186/187 closure still needs ancestry verification. Real-device/performance release gates remain.
