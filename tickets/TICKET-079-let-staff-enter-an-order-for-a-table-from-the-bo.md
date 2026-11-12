---
id: TICKET-079
title: Let staff enter an order for a table from the board
epic: ordering
status: in_progress
priority: high
estimate: M
labels: [frontend]
module: ordering
owner: unclechenna
agent: claude
blocked_by: [TICKET-078, TICKET-073]
blocks: [TICKET-154]
branch: TICKET-079
pr: ""
created: 2026-10-21
updated: 2026-11-12
started: 2026-11-12
completed: ""
reason: ""
resume_to: ""
---

# TICKET-079: Let staff enter an order for a table from the board

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
- 2026-11-12 — todo → claimed — unclechenna (claude) — started ahead of TICKET-078 (in_review)
- 2026-11-12 — todo → in_progress — unclechenna (claude) — started ahead of TICKET-078 (in_review)
