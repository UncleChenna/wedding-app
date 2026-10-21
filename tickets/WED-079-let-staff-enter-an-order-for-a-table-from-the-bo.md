---
id: WED-079
title: Let staff enter an order for a table from the board
epic: ordering
status: todo
priority: high
estimate: M
labels: [frontend]
module: ordering
owner: ""
agent: ""
blocked_by: [WED-078, WED-073]
blocks: [WED-154]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-079: Let staff enter an order for a table from the board

## Context

Waiters take orders by voice when a guest's phone can't connect.

See: [Connectivity plan](../docs/prd.md#connectivity-plan-signal-unknown).

## Scope

- "New order" on the board reusing the menu and cart components.
- Orders marked as staff-entered; limits apply except cooldown.

## Out of scope

- Payment.

## Acceptance criteria

- [ ] A staff-entered order appears on the right board and is flagged staff-entered (e2e).
- [ ] Staff-entered orders bypass cooldown but not item caps (unit).

## Test plan

- Unit: Limit exemptions.
- End-to-end: Board order entry.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/ordering/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
