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

## Verification update — 2026-11-08

PR: https://github.com/UncleChenna/wedding-app/pull/112 (draft), source e0046c1.
Managed setup succeeded after capacity was freed. All 20 public tables were empty
before testing; 19 applied migrations remained unchanged on repeat application.
All 20 tables retain RLS. Opt-in persisted tests passed: 2 tests in 2.94 seconds,
with equal hashes for every public table after two writes per profile, bounded
canonical admissions and enabled triggers. Log: /tmp/TICKET-026-persisted.log.
Default profile: 110 invitations, 249 guests, 28 tables, 31 scan events.
Load profile: 185 invitations, 350 guests seated on all 30 tables, 31 scan events.
Independent read-only review found no blocking code defect.

A separate actual `pnpm db:seed --profile default` invocation is still pending
while the local VM is overloaded; do not treat it or full verification as passed.
Stagger full browser runs after TICKET-098. The earlier start commit hook saw the
intentional failing-test stage; implementation commit e0046c1 subsequently passed
normal hooks and was pushed. Ticket status is in_progress; no criteria claimed done.
