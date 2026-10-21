---
id: WED-097
title: Show live counters on the admin dashboard
epic: admin
status: todo
priority: high
estimate: M
labels: [frontend, backend]
module: admin
owner: ""
agent: ""
blocked_by: [WED-033, WED-061, WED-072, WED-089]
blocks: []
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-097: Show live counters on the admin dashboard

## Context

ADM-3: invited, RSVP'd yes, arrived, orders open/served on one screen.

See: [Admin dashboard](../docs/prd.md#admin-dashboard) (ADM-3) · [Overview and goals](../docs/prd.md#overview-and-goals).

## Scope

- Counter tiles with live updates; arrivals in people, not invitations.

## Out of scope

- Charts.

## Acceptance criteria

- [ ] Counters match DB queries in a unit test on seed data.
- [ ] An admission updates 'arrived' within 2s (e2e).

## Test plan

- Unit: Counter queries.
- End-to-end: Live update.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
