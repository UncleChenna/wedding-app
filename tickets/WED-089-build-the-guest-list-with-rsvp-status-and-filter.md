---
id: WED-089
title: Build the guest list with RSVP status and filters
epic: admin
status: todo
priority: urgent
estimate: L
labels: [frontend, backend]
module: admin
owner: ""
agent: ""
blocked_by: [WED-023, WED-088, WED-043, WED-050]
blocks: [WED-051, WED-053, WED-090, WED-092, WED-093, WED-097, WED-100]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-089: Build the guest list with RSVP status and filters

## Context

The couple manage everything from the guest list: who's invited, sent, answered and coming.

See: [Admin dashboard](../docs/prd.md#admin-dashboard) (ADM-1).

## Scope

- Searchable list of invitations with guests, status, party size, table, side.
- Filters: status, sent, side, table.
- Revoke/reissue and Share actions per row.

## Out of scope

- Import (WED-091), export (WED-092).

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
