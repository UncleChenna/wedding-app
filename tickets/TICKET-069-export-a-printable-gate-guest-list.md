---
id: TICKET-069
title: Export a printable gate guest list
epic: checkin
status: todo
priority: high
estimate: S
labels: [frontend, backend]
module: checkin
owner: ""
agent: ""
blocked_by: [TICKET-024, TICKET-088]
blocks: [TICKET-161, TICKET-165]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-069: Export a printable gate guest list

## Context

Fallback: a printed guest list at the gate, exported the morning of the wedding.

See: [Performance and reliability](../docs/prd.md#performance-and-reliability).

## Scope

- Admin action producing a print-optimised page/PDF sorted by surname: name, party size, table, admitted-so-far boxes.

## Out of scope

- Printing logistics (TICKET-165).

## Acceptance criteria

- [ ] The export includes every rsvp_yes invitation and every tag-along name (unit).
- [ ] Prints on A4 in black and white without cut-off columns (manual print preview).

## Test plan

- Unit: Export rows.
- Manual: Print preview.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`
- `src/modules/checkin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
