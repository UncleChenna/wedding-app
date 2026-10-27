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
