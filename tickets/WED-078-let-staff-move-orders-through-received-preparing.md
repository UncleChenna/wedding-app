---
id: WED-078
title: Let staff move orders through received, preparing and served
epic: ordering
status: todo
priority: high
estimate: M
labels: [frontend, backend]
module: ordering
owner: ""
agent: ""
blocked_by: [WED-076]
blocks: [WED-075, WED-079, WED-082, WED-118, WED-129, WED-133]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-078: Let staff move orders through received, preparing and served

## Context

Staff update status Received → Preparing → Served, or Cancelled, with immediate feedback.

See: [Table ordering](../docs/prd.md#table-ordering) (ORD-5).

## Scope

- Large buttons; optimistic update with rollback on failure.
- Cancel requires confirmation and a reason.
- Served orders collapse into a recent list.

## Out of scope

- Staff-entered orders (WED-079).

## Acceptance criteria

- [ ] Only legal status moves are accepted server-side (unit).
- [ ] A failed update reverts the card and shows an error (e2e with forced failure).
- [ ] Every move is timestamped.

## Test plan

- Unit: Status machine.
- End-to-end: Move an order to served.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/ordering/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
