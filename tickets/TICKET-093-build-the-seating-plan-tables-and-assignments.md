---
id: TICKET-093
title: "Build the seating plan: tables and assignments"
epic: admin
status: in_progress
priority: high
estimate: L
labels: [frontend, backend]
module: admin
owner: divine
agent: codex
blocked_by: [TICKET-089]
blocks: [TICKET-094, TICKET-118, TICKET-134, TICKET-154]
branch: TICKET-093
pr: ""
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-093: Build the seating plan: tables and assignments

## Context

ADM-2: assign guests to tables; the scanner shows the table number.

See: [Admin dashboard](../docs/prd.md#admin-dashboard) (ADM-2).

## Scope

- Tables CRUD (number, name, capacity).
- Assign invitations to tables with capacity warnings; keyboard-accessible (no drag-only).

## Out of scope

- Table cards (TICKET-094).

## Acceptance criteria

- [ ] Over-capacity assignment warns but is allowed (unit).
- [ ] Assignments show on the scanner result (e2e).

## Test plan

- Unit: Capacity logic.
- End-to-end: Assign via keyboard.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — divine (codex)
- 2026-11-09 — todo → in_progress — divine (codex)
