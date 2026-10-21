---
id: WED-101
title: Build the event settings page
epic: admin
status: todo
priority: high
estimate: M
labels: [frontend, backend]
module: admin
owner: ""
agent: ""
blocked_by: [WED-025, WED-088]
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

# WED-101: Build the event settings page

## Context

Couple names, date, venue, map, dress code, RSVP lock, ordering switch, limits, Wi-Fi details and voice live in one place.

See: [Journey 1: receiving the IV and RSVP](../docs/prd.md#journey-1-receiving-the-iv-and-rsvp) · [Table ordering](../docs/prd.md#table-ordering) (ORD-7) · [Current state](../docs/current-state.md).

## Scope

- Form for every event_settings field with validation and help text.

## Out of scope

- Theme editing.

## Acceptance criteria

- [ ] Saving updates the IV page and limits immediately (e2e).
- [ ] Invalid dates (lock after the wedding) are rejected (unit).

## Test plan

- Unit: Validation.
- End-to-end: Edit settings.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
