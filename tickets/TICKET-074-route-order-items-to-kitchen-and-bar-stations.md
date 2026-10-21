---
id: TICKET-074
title: Route order items to kitchen and bar stations
epic: ordering
status: todo
priority: high
estimate: M
labels: [backend]
module: ordering
owner: ""
agent: ""
blocked_by: [TICKET-072]
blocks: [TICKET-073, TICKET-075, TICKET-076, TICKET-084]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-074: Route order items to kitchen and bar stations

## Context

Food goes to the kitchen and drinks to the bar; a mixed order must show up on both boards with only their items.

See: [Table ordering](../docs/prd.md#table-ordering) (ORD-4) · [Journey 3: ordering from the table](../docs/prd.md#journey-3-ordering-from-the-table).

## Scope

- Split a submission into one order per station (see docs/current-state.md assumption 8).
- Guest confirmation groups both.

## Out of scope

- Boards.

## Acceptance criteria

- [ ] A mixed order creates one kitchen and one bar order sharing a submission id (unit).
- [ ] Single-station orders create one order.

## Test plan

- Unit: Splitting.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/ordering/server/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
