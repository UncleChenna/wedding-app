# TICKET-171 migration verification

2026-11-02. Base develop: 2f066ebbb175c4b8d42b0ab6f54545134f52f592.
Integration commit: 15e5d26. Isolated project wedding-ebb5922a7e90, database port 26821.
PR: https://github.com/UncleChenna/wedding-app/pull/48.

## Authorization and generated sequence

The user approved carrying unchanged develop protected files, recording exact paths, and generating/testing0006–0008 only in this isolated database. Approval is recorded in ignored .harness/approved-writes.json. Production application is not authorized.

Drizzle generated 0006 expansion, 0007 custom backfill scaffold and 0008 contract, with snapshots/journal. Filled0007 before applying it. An initial unapplied expansion unnecessarily removed the old positive-quantity check. Used Drizzle's drop command to remove only those three unapplied artifacts, then regenerated with that check retained. No applied migration was edited.

The expansion retains the legacy category column, adds nullable new classification/link fields, station children and idempotency UUIDs. Backfill maps only unambiguous legacy food to meal; drinks require explicit mapping. It preserves notes/IDs/timestamps/quantities/parent status, creates one child per represented station, maps child ready to preparing while preserving parent ready, and sets historical line caps to greatest(5, quantity). Contract enforces nullability, uniqueness, composite submission/child links and caps. No table/column drop, row delete or truncation appears in these migrations.

## Evidence

- Before changes: all 8 new constraint tests failed on missing category_v2.
- After migration: 8 constraint tests and 6 rollback-only bootstrap preservation/rejection tests pass.
- Preservation covers mixed kitchen/bar submissions, empty cancelled orders, original row values, ready status, historical quantity 8, correct station links and distinct client request UUIDs.
- Failure cases preserve original rows and create no children for unresolved drink classification, duplicate order/menu lines and quantity 101.
- Expansion still rejects quantity 0 before backfill/contract.
- The temporary-schema test initially hit PostgreSQL prepared-result type caching across fresh enum OIDs; disabled prepared statements for that DDL test connection only. All assertions remain.
- Empty isolated database migrated 6→9 entries. Second migration retained 9 entries and zero rows across every public table.
- Seed twice produced identical counts (table below); RLS passes for all 13 public tables.
- Drizzle snapshot check passes.
- Full verification currently passes format/lint/types, 673 unit tests (27 conditional skips) and production build; 697 browser tests passed (147 existing conditional/project skips). Full verification session60863 exited0.

| Table              | First seed | Second seed |
| ------------------ | ---------: | ----------: |
| check_ins          |         30 |          30 |
| event_settings     |          1 |           1 |
| guests             |        248 |         248 |
| invitations        |        110 |         110 |
| menu_items         |         16 |          16 |
| order_items        |         35 |          35 |
| orders             |         18 |          18 |
| rsvp_changes       |          0 |           0 |
| rsvps              |         85 |          85 |
| staff              |          4 |           4 |
| station_orders     |         28 |          28 |
| tables             |         28 |          28 |
| themes             |          4 |           4 |
| applied migrations |          9 |           9 |

## Populated-database rollout boundary

Do not deploy this blindly to an active populated database. Pause ordering writes, back up and review data first. Drizzle normally wraps all pending stages in one transaction: an unmapped drink causes the entire pending chain to roll back, including expansion. An operator-reviewed staged release must apply expansion separately, then set category_v2 using an explicit ID/category mapping, then apply backfill and contract. The deployment workflow belongs to TICKET-150; this ticket does not execute it or classify real menu rows.

Historical quantityLimit is a retained snapshot, not a client-controlled entitlement. TICKET-074 must enforce current menu caps, availability, idempotency and table limits transactionally. Parent submissions, not station children, count against table limits.

Before application, rollback means reverting unapplied source. After application, use an approved forward repair or a separately rehearsed restore; do not drop child rows or edit applied SQL.

## Remaining verification

Full verification passed. The mandatory PR-transition gate and final-head CI remain. Automatic approval review refused a separate local drift-generation command because it could create an unapproved extra migration path; no workaround was used. The existing CI migrations/seed/schema-drift job remains mandatory. No workflow was changed, and local opt-in database tests are not represented as CI executions.
