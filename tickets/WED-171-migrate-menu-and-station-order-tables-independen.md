---
id: WED-171
title: Migrate menu and station order tables independently
epic: data-auth
status: todo
priority: urgent
estimate: M
labels: [db, backend]
module: shared
owner: ""
agent: ""
blocked_by: [WED-023]
blocks: [WED-026, WED-027, WED-041, WED-070, WED-084, WED-095]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-171: Migrate menu and station order tables independently

## Context

Backlog audit coverage: ORD-1–9. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Extract menu and ordering schema work from WED-024.

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
