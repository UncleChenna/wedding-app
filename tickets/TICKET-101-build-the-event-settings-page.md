---
id: TICKET-101
title: Build the event settings page
epic: admin
status: todo
priority: urgent
estimate: M
labels: [frontend, backend]
module: admin
owner: ""
agent: ""
blocked_by: [TICKET-025, TICKET-088, TICKET-034, TICKET-035]
blocks: [TICKET-154, TICKET-176]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-101: Build the event settings page

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

- [ ] Draft settings can retain TBD details, but live publication/RSVP activation requires an explicitly configured valid event time zone; missing/invalid values must not become a development default.

## Test plan

- Unit: Validation.
- End-to-end: Edit settings.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

- 2026-10-26: Approved values are in docs/prd.md#approved-event-defaults (owner, 2026-10-26): Uchenna and Adaora; 2026-12-19; default one tag-along editable per invitation; lock at event-local midnight; retention 90 days. Venue, ceremony time, map, dress code and time zone are TBD. Wallet is deferred.

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
