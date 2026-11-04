---
id: TICKET-074
title: Route order items to kitchen and bar stations
epic: ordering
status: in_progress
priority: high
estimate: M
labels: [backend]
module: ordering
owner: unclechenna
agent: claude
blocked_by: [TICKET-072]
blocks: [TICKET-073, TICKET-075, TICKET-076, TICKET-084]
branch: TICKET-074
pr: ""
created: 2026-10-21
updated: 2026-11-04
started: 2026-11-04
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

- [x] A mixed order creates one kitchen and one bar order sharing a submission id (unit).
- [x] Single-station orders create one order.

## Test plan

- Unit: Splitting.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/ordering/server/`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-04:
  - **Split.** `lib/stations.ts` `splitByStation` groups a submission into one ticket per station it touches, kitchen
    then bar; `createOrder` writes one `station_orders` row per group, all sharing the `orders.id` submission id.
    TICKET-072 already wrote station rows because the schema requires them; this ticket makes the split explicit,
    shared with the guest view and tested.
  - **Guest confirmation** groups the sent order under "From the kitchen" and "From the bar" (provisional copy). The
    guest menu now includes each item's station; it isn't sensitive.
  - **Evidence.** Unit: `stations.test.ts` (mixed, kitchen-only, bar-only, empty) and the composer grouping test.
    Database (`RUN_ORDER_SUBMIT_DB_TESTS=1`): a single-station order creates one ticket and a mixed one creates two
    sharing the submission id. Browser: the flaky-network test checks both groups. Screenshots in
    `docs/reviews/TICKET-074/`.
  - **Boards** remain TICKET-076/077.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-04 — todo → claimed — unclechenna (claude)
- 2026-11-04 — todo → in_progress — unclechenna (claude)
