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
blocks: [TICKET-060, TICKET-094, TICKET-118, TICKET-134, TICKET-154]
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
- [ ] Assignment, reassignment, renumbering and unassignment persist on the canonical invitation and appear on the current guest pass (e2e).
- [ ] TICKET-060 retains the mandatory live scanner-result assertion and depends on this ticket.

## Test plan

- Unit: Capacity logic.
- End-to-end: Assign via keyboard.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

- 2026-11-09 — Scanner result screens do not exist yet (TICKET-060). Keep their assignment-display assertion mandatory there and make this ticket a prerequisite; verify the existing live pass reader here. No scanner requirement is removed.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — divine (codex)
- 2026-11-09 — todo → in_progress — divine (codex)
