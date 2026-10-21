---
id: TICKET-089
title: Build the guest list with RSVP status and filters
epic: admin
status: todo
priority: urgent
estimate: L
labels: [frontend, backend]
module: admin
owner: ""
agent: ""
blocked_by: [TICKET-023, TICKET-088, TICKET-043, TICKET-050]
blocks: [TICKET-051, TICKET-053, TICKET-090, TICKET-092, TICKET-093, TICKET-097, TICKET-100]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-089: Build the guest list with RSVP status and filters

## Context

The couple manage everything from the guest list: who's invited, sent, answered and coming.

See: [Admin dashboard](../docs/prd.md#admin-dashboard) (ADM-1).

## Scope

- Searchable list of invitations with guests, status, party size, table, side.
- Filters: status, sent, side, table.
- Revoke/reissue and Share actions per row.

## Out of scope

- Import (TICKET-091), export (TICKET-092).

## Acceptance criteria

- [ ] Filters combine and match a query unit test.
- [ ] 300 invitations render and filter in <200ms (measured).
- [ ] Rows are usable at 375px.

## Test plan

- Unit: Filter query.
- End-to-end: Filter and search.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
