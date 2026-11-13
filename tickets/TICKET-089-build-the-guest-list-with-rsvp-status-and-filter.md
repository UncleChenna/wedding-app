---
id: TICKET-089
title: Build the guest list with RSVP status and filters
epic: admin
status: done
priority: urgent
estimate: L
labels: [frontend, backend]
module: admin
owner: divine
agent: codex
blocked_by: [TICKET-023, TICKET-088, TICKET-043, TICKET-050]
blocks: [TICKET-051, TICKET-053, TICKET-090, TICKET-092, TICKET-093, TICKET-097, TICKET-100]
branch: TICKET-089
pr: https://github.com/UncleChenna/wedding-app/pull/114
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-09
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

- [x] Filters combine and match a query unit test.
- [x] 300 invitations render and filter in <200ms (measured).
- [x] Rows are usable at 375px.

## Test plan

- Unit: Filter query.
- End-to-end: Filter and search.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

2026-11-09 — Authenticated mobile/desktop journey2/2 and existing dialogue/shell
regressions80/80 pass. All-theme axe, long-side wrapping and bottom-navigation
clearance pass. Five300-row remount/filter samples per viewport stay below200ms
(max49.2ms mobile,32.3ms desktop); navigation timing is recorded separately.
Shared Sheet Escape/reopen race reproduced, regression-tested and fixed; independent
review found no blocker. Quick lint/types/103related tests pass; final CI pending.
See docs/plans/TICKET-089-pr.md and docs/reviews/TICKET-089/.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — divine (codex) — started ahead of TICKET-043 (in_progress)
- 2026-11-09 — todo → in_progress — divine (codex) — started ahead of TICKET-043 (in_progress)
- 2026-11-09 — in_progress → in_review — divine (codex)
