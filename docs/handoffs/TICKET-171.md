# TICKET-171 — 2026-10-27

Owner divine; agent codex; branch TICKET-171; base 3752e0591e225a0dd4421c84c225917dca270e29. Project wedding-ebb5922a7e90; DB26821, app26830, PW26831. Claimed/in_progress.

## Source implementation so far

Schema retains orders as guest submissions, adds unique clientRequestId, station_orders with unique submission/station and queue index, and order-item composite FK linking the child to the same submission. Lines have positive quantity <= bounded quantityLimit and unique submission/menu-item identity. Menu canonical category is new category_v2 enum (meal/soft_drink/alcohol); legacy category column is retained as nullable legacyCategory. Max per item is 1–100 and live availability remains.

Deterministic seed has three categories, an explicitly non-alcoholic sample Chapman, guaranteed mixed-station submission and separate children with matching lines. Parent legacy status is retained; station status has only received/preparing/served/cancelled. An old ready parent maps to preparing child while original status is preserved.

## Evidence / current limits

Three new seed regressions failed before implementation, then all eight seed tests passed. Quick gate passes lint, types and eight related tests (two opt-in DB skips). No migration generated or applied. No real constraint or data-preservation proof yet; full gate not run. Source schema is intentionally ahead of migrations, so hosted schema-drift check is expected to fail while draft.

The initial t:move start commit raced with writing red tests and was rejected by the quick hook; ledger already recorded in_progress and its ticket-only file remained staged. Finish/retry status commit only after confirming the failure is terminal. Lesson: await t:move commit/push completion before writing failing tests; do not overlap these mutations. Recovery commit 4d37d14 completed and was pushed to origin/TICKET-171 after the quick gate passed.

## Next required work

1. Add isolated real-Postgres tests for orphan/composite FK failures, categories, quantity/cap boundaries, duplicate client id, unique station projections, and one submission count for mixed child orders; run red against old schema.
2. Prepare a concrete expand/backfill/contract migration proposal and review SQL before asking exact-path approval. Start with nullable new category/line link, create new enum separately from legacy type, preserve existing rows/IDs/status, backfill children and lines, then enforce final constraints. Unknown legacy drinks and duplicate legacy lines must fail with actionable preflight, not be silently guessed or dropped. Bootstrap sample mapping needs explicit review; generic Chapman cannot be assumed non-alcoholic in real data. Snapshot cap policy must preserve historical quantities or explicitly reject unsupported data without clipping.
3. Existing orders' parent status is historical; future open limits count parent submissions with open children. TICKET-074 must validate current menu caps and request idempotency; clients cannot choose trusted quantityLimit. Do not claim these transaction APIs exist yet.
4. Obtain exact approval before generating SQL/snapshots/journal or recording authorization. TICKET-025 and TICKET-172 also await migration authorization against journal idx1. Serialize merges and regenerate later branches with fresh path approval. Do not merge snapshots manually.
5. Prove empty and existing bootstrap migrations, repeat migrate/counts and seed/counts, RLS and constraints; then full gate, complete evidence, PR review transition and final-head CI.

No production work or destructive reset authorized. Other owner's TICKET-204 is untouched. TICKET-172 is blocked in PR47; TICKET-025 in PR44. Prior TICKET-023 approval covers neither.

Draft PR: https://github.com/UncleChenna/wedding-app/pull/48. Source f0515b8 is pushed. See docs/reviews/TICKET-171/migration-approval.md for the concrete staged proposal and exact protected paths. Await explicit authorization before generating migrations.

## 2026-11-02 — source integration refresh

Resumed through CLI for approval preparation. Merged develop 2f066ebbb175c4b8d42b0ab6f54545134f52f592 with --no-commit; resolved the sole conflict in scripts/seed.ts by retaining event_settings, rsvp_changes, its transactional append-only-trigger handling, and station_orders. Quick verification passes lint/types / 425 related tests (19 conditional skips); all 9 seed tests pass. No seed/database mutation executed. Existing protected files match develop byte-for-byte. New proposed migration indices are0006–0008, documented with exact paths in docs/reviews/TICKET-171/migration-approval.md.

Merge commit and generated migrations require explicit exact-path authorization before proceeding. Do not apply the obsolete0002–0004 proposal or fabricate approval. Next: obtain authorization, finish this reviewed integration commit, push PR48 update, then generate/test the staged migrations and all preservation/constraint cases. Existing inherited migrations have not been edited.

The CLI returned TICKET-171 to blocked with the updated exact approval reason. The resolved merge remains staged and uncommitted; no bypass of protected-file authorization. PR48 description publishes the refreshed proposal while clearly distinguishing it from the older published source diff. User questions separately request inherited-file authorization and new isolated migration generation/testing. Await actual responses.

## 2026-11-02 — approved migrations implemented

User approved both exact-path requests. Recorded authorization; integration15e5d26 pushed. Generated and applied approved0006–0008 through Drizzle in isolated projectwedding-ebb5922a7e90 only. All 14 database tests pass, repeat migration/seed counts match and all 13 tables retain RLS. See docs/reviews/TICKET-171/README.md. Full verification session60863 is live:673 units and production build passed, browser checks ongoing. Next: resume that session, record its actual terminal result, commit/push migrations and tests, finish PR48 through t:pr and final-head CI. No production application authorized; do not edit the now-applied SQL. Separate local drift generation was rejected by automatic approval review; existing CI drift check remains required.

## Full verification result

Full verification session60863 exited0: format, lint, types,673 unit tests (27 conditional skips), production build and697 browser tests (147 existing conditional/project skips) passed. Implementation commit07bc329 contains the tested migrations and database tests; later commits change review evidence only. Proceed with RUN_ORDERING_DB_TESTS=1 VITEST_MAX_WORKERS=2 AGENT_OWNER=divine pnpm t:pr TICKET-171, then final-head CI and human review. Never edit applied migrations.

## Review transition complete

2026-11-02: pnpm t:pr passed at source1396d2084de25a4e9a6586d22e57b371d5f344b1 with673 unit tests and697 browser tests (27/147 existing conditional/project skips). Session19150 exited0. The CLI linked PR48, moved TICKET-171 to in_review and pushed status commit16f18a1. PR48 is ready for human review.

CI run41427304515 on the implementation head passed migrations twice, seeds twice and the exact schema-drift step. Its general verification job was still running at the last poll; final evidence/status commits also require final-head CI. The previously rejected local drift command is no longer a missing evidence item because established CI executed the check successfully. Next: verify CI for the latest pushed HEAD; leave merge to the human under current AGENTS.md. After confirmed merge, close through the CLI.
