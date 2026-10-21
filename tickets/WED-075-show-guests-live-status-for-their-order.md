---
id: WED-075
title: Show guests live status for their order
epic: ordering
status: todo
priority: high
estimate: M
labels: [frontend]
module: ordering
owner: ""
agent: ""
blocked_by: [WED-033, WED-074]
blocks: [WED-081, WED-117, WED-133, WED-135]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-075: Show guests live status for their order

## Context

The guest's page updates live through Received, Preparing, Served ("Enjoy every bite.").

See: [Table ordering](../docs/prd.md#table-ordering) (ORD-3) · [Journey 3: ordering from the table](../docs/prd.md#journey-3-ordering-from-the-table) · [On the website](../docs/prd.md#on-the-website).

## Scope

- Confirmation screen per station with live status.
- Public read by submission id only (unguessable).

## Out of scope

- Push notifications to guests.

## Acceptance criteria

- [ ] A board status change shows on the guest page within 2s (e2e).
- [ ] Another submission's id cannot be guessed (≥96-bit id, unit).

## Test plan

- End-to-end: Two-context status update.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/ordering/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
