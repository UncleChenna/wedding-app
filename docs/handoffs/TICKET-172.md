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
