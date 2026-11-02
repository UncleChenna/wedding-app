# TICKET-171 migration proposal — 2026-11-02

Draft PR: https://github.com/UncleChenna/wedding-app/pull/48
Original source commit: f0515b8. Prepared merge base: 2f066ebbb175c4b8d42b0ab6f54545134f52f592. Merge is locally resolved but not committed pending inherited protected-file authorization.

## Requested scope

Generate and test three unapplied migrations only in this ticket's isolated local database (project wedding-ebb5922a7e90, port 26821). This does not authorize production application, deletion of guest data, or access-policy changes. Retain RLS with no browser policies.

Exact protected outputs:

- drizzle/0006_ordering-expand.sql
- drizzle/meta/0006_snapshot.json
- drizzle/0007_ordering-backfill.sql
- drizzle/meta/0007_snapshot.json
- drizzle/0008_ordering-contract.sql
- drizzle/meta/0008_snapshot.json
- drizzle/meta/_journal.json

Record explicit approval in ignored .harness/approved-writes.json only after the user authorizes it. Generate all SQL/snapshot scaffolding with Drizzle. The new custom backfill SQL may be filled before application; never edit applied SQL or snapshots manually. If generator output paths differ, stop and obtain approval for the actual paths.

## Reviewable migration sequence

1. Expand: use a temporary source-schema stage with nullable category_v2 and station_order_id, new category/status enums, station_orders, max_per_order and quantity_limit. Preserve legacy category as nullable and all existing columns, IDs, notes, timestamps, quantities and parent statuses. Add UUID client_request_id with a generated per-row default and unique constraint. Generate the expand migration from this source stage; the checked-in final source remains the contract.
2. Backfill: generate a custom migration scaffold. Translate food to meal. Do not infer soft_drink or alcohol from station or drink names. Existing drinks require an explicitly reviewed category_v2 mapping before contract application. Reject unresolved categories with a clear error and no row loss. Reject duplicate (order_id, menu_item_id) pairs rather than collapsing historical lines. Reject historical quantities outside 1–100; preserve supported quantities with quantity_limit = greatest(5, quantity), without changing menu caps or quantities.
3. Create one station_orders row for each distinct existing (order_id, menu_items.station), retaining parent creation/update timestamps. Map received/preparing/served/cancelled directly; map legacy ready to preparing, retaining the original ready status on orders. Link each existing order_items row to its same-parent, matching-station child. Keep empty parent orders without inventing line items.
4. Contract: restore the final source schema and generate the final migration. Enforce non-null category/link fields, unique parent/menu and parent/station keys, bounded caps and composite parent/child FK. No DROP TABLE, DROP COLUMN, DELETE or TRUNCATE is part of the migration.
5. Populated databases with unresolved drink classifications stop for an operator-reviewed mapping; the migration is not a silent classification tool. This approval does not authorize inventing that mapping for real guest data.

## Required verification before completion

- Start with failing real-Postgres tests for invalid categories/caps/quantities, orphan and cross-parent child links, duplicate request keys, duplicate station children, and mixed submissions counted once.
- Test the complete chain on an empty isolated database.
- Test preservation of known bootstrap fixtures, including explicit fixture drink classifications, mixed kitchen/bar orders, legacy ready statuses, empty orders and historical quantities above five.
- Separately prove ambiguous drink classifications, duplicate legacy lines and quantities over 100 fail without losing rows.
- Compare IDs, quantities, timestamps, notes and parent counts before/after. Run migrations twice and compare counts.
- Run deterministic seed twice, constraint tests, RLS checks, quick and full verification; do not mark acceptance complete before these pass.

## Current evidence and coordination

Nine seed unit tests pass; refreshed quick verification passes lint, types and425 related tests (19 conditional skips). No generated migration or database-preservation proof exists yet. This is a proposal, not verified SQL. TICKET-025 and subsequent event-setting migrations are now merged; journal indices0–5 are already occupied. TICKET-172 remains pending; serialize it after this ticket and regenerate against the then-current journal. An approval for TICKET-023 does not cover these files.

Rollback before release is reverting unapplied branch changes. After application, use a separately reviewed forward repair; do not drop the new child rows or overwrite restored guest data.

## Unchanged develop files awaiting commit authorization

The resolved integration inherits these exact files byte-identical to develop2f066eb (verified with git diff; no differences):

- pnpm-lock.yaml
- src/modules/theming/themes/theme.schema.json
- drizzle/0002_event-settings-rsvp-history.sql
- drizzle/0003_rsvp-history-append-only.sql
- drizzle/0004_furry_wolfpack.sql
- drizzle/0005_blue_ravenous.sql
- drizzle/meta/0002_snapshot.json
- drizzle/meta/0003_snapshot.json
- drizzle/meta/0004_snapshot.json
- drizzle/meta/0005_snapshot.json
- drizzle/meta/_journal.json

Authorization to carry these existing files is separate from permission to generate the proposed0006–0008 sequence. No new migration has been generated or applied; no populated-database safety claim is made. Record any explicit approval in .worktrees/TICKET-171/.harness/approved-writes.json, never fabricate it.

## Approval and execution record — 2026-11-02

The user explicitly approved both requests: unchanged inherited files and generation/isolated testing of0006–0008, including recording authorization. Integration15e5d26 is pushed. Generated migrations and tests are committed in07bc329; they were applied only to projectwedding-ebb5922a7e90. All14 database cases, repeated migration/seeding and RLS checks pass. See README.md for actual evidence and remaining browser/CI gates. The earlier pending-approval wording above is historical, not a current blocker.
