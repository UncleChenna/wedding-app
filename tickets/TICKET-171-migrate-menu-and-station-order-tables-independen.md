---
id: TICKET-171
title: Migrate menu and station order tables independently
epic: data-auth
status: blocked
priority: urgent
estimate: M
labels: [db, backend]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-023]
blocks: [TICKET-026, TICKET-027, TICKET-041, TICKET-070, TICKET-084, TICKET-095]
branch: TICKET-171
pr: ""
created: 2026-10-21
updated: 2026-10-27
started: 2026-10-27
completed: ""
reason: "Draft PR #48: source and staged migration proposal pushed; awaiting exact-path authorization for 0002 ordering-expand, 0003 ordering-backfill, 0004 ordering-contract and generated metadata. Existing approval covers TICKET-023 only."
resume_to: in_progress
---

# TICKET-171: Migrate menu and station order tables independently

## Context

Backlog audit coverage: ORD-1–9. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Extract menu and ordering schema work from TICKET-024.

## Out of scope

- Work outside the stated contract; consuming screens and launch operations remain in their linked tickets. No product implementation is part of this audit.

## Acceptance criteria

- [ ] Migrate categories, menu items, stations, orders and line items with foreign keys, indexes, quantity/cap constraints and live availability fields.
- [ ] Represent one guest submission across kitchen/bar child orders with a stable group and idempotency key; table-level limits count submissions consistently.
- [ ] Seed deterministic mixed-station orders and test migration against an empty database and the existing bootstrap schema without dropping live data.

## Test plan

- Integration: migrate a disposable database; reject orphan rows and invalid quantities; create a mixed submission and verify both station projections. Unit: check schema constraints through database failures.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- src/modules/shared/server/db/; drizzle/; scripts/seed.ts

## Notes / decisions

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.

## Activity log

- 2026-10-21 — new → todo — divine
- 2026-10-27 — todo → claimed — divine (codex)
- 2026-10-27 — todo → in_progress — divine (codex)
- 2026-10-27 — in_progress → blocked — divine (codex) — Draft PR #48: source and staged migration proposal pushed; awaiting exact-path authorization for 0002 ordering-expand, 0003 ordering-backfill, 0004 ordering-contract and generated metadata. Existing approval covers TICKET-023 only.
