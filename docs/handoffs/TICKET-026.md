# TICKET-026 — 2026-11-08

Owner: divine; branch: TICKET-026. Base develop
`407fb68db4dde004cf0868274a744ebd435dbbb2`.

Implemented default/load fixture profiles, complete invitation-level household
seating, exactly 350 named/seated load guests on 30 tables, explicit default
revoked/declined/partial-admission/sold-out cases and fixed timestamps. Existing
historical check-ins have corresponding canonical scan evidence; admission
triggers remain enabled. `pnpm db:seed --profile load` selects load fixtures;
unknown CLI arguments fail before the reset transaction.

Verification: initial tests demonstrated three missing behaviours. All 20 fixture
and CLI tests now pass. Quick verification passed lint/types and 21 related tests
before the final load-seating strengthening (which passed its 20-test rerun).
Strict types initially caught two nullable-ID/result accesses; fixed explicitly.
The persisted-row hash suite is opt-in via `RUN_SEED_DB_TESTS=1`, not yet run.

Managed setup initially failed to start Supabase. Retrying after the completed
TICKET-024 stack was stopped with its backup preserved. No other stack was stopped.
Do not read/use the copied primary environment until managed setup rewrites it to
this worktree's reserved identity. No production changes or migration edits.

Next: complete managed setup; run migration/count comparison twice and RLS checks;
run `RUN_SEED_DB_TESTS=1 pnpm exec vitest run scripts/__tests__/seed-store.test.ts`;
record persisted hashes and default/load counts, run full verification, obtain
independent review and open/update the PR. Only mark acceptance criteria after
evidence exists. Current user authorizes reviewed, verified PR merges and necessary
isolated test operations without further confirmation.
