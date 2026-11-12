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

- [x] A staff-entered order appears on the right board and is flagged staff-entered (e2e).
- [x] Staff-entered orders bypass cooldown but not item caps (unit).

## Test plan

- Unit: Limit exemptions.
- End-to-end: Board order entry.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/ordering/`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-12 (unclechenna, claude):
  - **"New order" on each board** opens a bottom sheet with the table number, the guest menu (`MenuSections`, same
    caps and sold-out states) and a note. It posts to `/api/<station>/orders`, which checks the live station
    session and reuses the guest order handler.
  - **Limits:** staff orders skip only the table cooldown. The open-order limit and item caps still apply, and they
    can still be placed while guest ordering is closed (as before).
  - **Record:** `orders.entered_by_staff_id` (migration 0031, additive) records who entered it. Boards show
    "Staff order" on those tickets.
  - **Board e2e harness:** the spec now runs serially, because tests share the event settings that keep staff
    signed in. It also resets the localhost PIN budget per test, so repeated runs don't hit the sign-in limit.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-12 — todo → claimed — unclechenna (claude) — started ahead of TICKET-078 (in_review)
- 2026-11-12 — todo → in_progress — unclechenna (claude) — started ahead of TICKET-078 (in_review)
