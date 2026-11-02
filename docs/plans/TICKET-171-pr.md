# Ticket

Ticket: TICKET-171

# Summary

Orders need separate kitchen/bar progress while one guest submission counts once. This change adds station child orders, idempotency keys, explicit menu categories and bounded line quantities through three generated migrations that preserve legacy records.

# Changes

- Generate 0006 expansion, 0007 reviewed custom backfill and 0008 final constraints; retain all old columns and the positive-quantity check.
- Preserve parent IDs/status/notes/timestamps and quantities. Create one child per represented station; legacy ready maps to preparing only on the child.
- Require explicit classification for ambiguous legacy drinks; reject duplicate legacy lines and quantities above 100 without dropping or clipping data.
- Add 14 real-Postgres constraint/preservation tests and deterministic mixed-station seeds.
- Integrate develop 2f066eb, retaining its RSVP-history seed handling and database isolation guard.

# Acceptance criteria and evidence

All three functional criteria are implemented: schema constraints and mixed-station grouping pass 8 database tests; empty and populated bootstrap migration preservation/rejections pass 6 tests; seed runs are repeatable. Evidence: docs/reviews/TICKET-171/README.md.

# Verification

- Initial 8 database tests failed before schema changes; all 14 now pass against the approved isolated database.
- Migrate twice: 9 applied migrations each time, identical row counts.
- Seed twice: identical counts, including 18 submissions, 28 station children and 35 lines.
- RLS enabled on all 13 public tables; Drizzle snapshot check passes.
- Quick gate passed lint/types; full gate has passed 673 unit tests (27 conditional skips) and production build. Full browser verification passed: 697 tests, with 147 existing conditional/project skips. The PR transition gate and final-head CI remain.
- A separate local drift-generation command was rejected because it could create a migration outside approved paths. Existing CI schema-drift/migrate/seed checks remain mandatory. The 14 opt-in database tests ran locally; no CI execution of those tests is claimed.

# Risks and rollout

Authorization covers only this isolated database. No production migration was executed. Populated databases require paused ordering writes, backup and an operator-reviewed staged expansion release, then explicit drink ID/category mapping, then backfill/contract. The ordinary Drizzle command wraps pending stages in one transaction and rolls them all back on ambiguous data; do not blindly retry expecting the expansion to remain applied.

Historical line caps preserve quantities; TICKET-074 must enforce current caps/availability and table limits in its transaction API. No client may choose a trusted historical cap. Before application, revert unapplied changes; after application, use an approved forward repair or rehearsed restore. Never edit applied migration SQL or drop guest records.

# Screenshots

N/A: database schema, migrations, seeds and tests; no UI output changes.

# UI checklist

N/A for layout, screenshots, typography, controls, keyboard, motion, images, guest copy, performance, device sharing, physical QR or staff feedback: no rendered component or active theme changes. Existing release QA gates remain mandatory. Full application regression gate passes: 673 units and 697 browser tests.
