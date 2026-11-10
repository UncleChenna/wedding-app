---
id: TICKET-078
title: Let staff move orders through received, preparing and served
epic: ordering
status: in_progress
priority: high
estimate: M
labels: [frontend, backend]
module: ordering
owner: unclechenna
agent: claude
blocked_by: [TICKET-076]
blocks: [TICKET-075, TICKET-079, TICKET-082, TICKET-118, TICKET-129, TICKET-133]
branch: TICKET-078
pr: ""
created: 2026-10-21
updated: 2026-11-10
started: 2026-11-10
completed: ""
reason: ""
resume_to: ""
---

# TICKET-078: Let staff move orders through received, preparing and served

## Context

Staff update status Received → Preparing → Served, or Cancelled, with immediate feedback.

See: [Table ordering](../docs/prd.md#table-ordering) (ORD-5).

## Scope

- Large buttons; optimistic update with rollback on failure.
- Cancel requires confirmation and a reason.
- Served orders collapse into a recent list.

## Out of scope

- Staff-entered orders (TICKET-079).

## Acceptance criteria

- [x] Only legal status moves are accepted server-side (unit).
- [x] A failed update reverts the card and shows an error (e2e with forced failure).
- [x] Every move is timestamped.

## Test plan

- Unit: Status machine.
- End-to-end: Move an order to served.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/ordering/`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-10 (unclechenna, claude):
  - **Moves:** received → preparing → served, or cancelled before served. Received → served is allowed for quick
    drinks. Served and cancelled are final.
  - **History:** every move is a row in `station_order_events` (migration 0028, additive) with the from and to
    status, staff, device and time. The database refuses a cancel without a reason.
  - **Two tablets:** each move names the status the board showed. A move from an out-of-date status is refused as
    `stale`, so racing tablets can't both win.
  - **Order status** follows its tickets, so the table's open-order limit frees up once everything is served.
  - **Stacked on TICKET-077 (#155)**, which is stacked on TICKET-076 (#140).

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-10 — todo → claimed — unclechenna (claude) — started ahead of TICKET-076 (in_progress)
- 2026-11-10 — todo → in_progress — unclechenna (claude) — started ahead of TICKET-076 (in_progress)
