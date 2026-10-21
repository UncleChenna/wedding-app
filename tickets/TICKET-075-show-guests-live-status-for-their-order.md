---
id: TICKET-075
title: Show guests live status for their order
epic: ordering
status: todo
priority: high
estimate: M
labels: [frontend]
module: ordering
owner: ""
agent: ""
blocked_by: [TICKET-033, TICKET-074, TICKET-078]
blocks: [TICKET-081, TICKET-117, TICKET-133, TICKET-135]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-075: Show guests live status for their order

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

- [ ] Anonymous status responses disclose only the opaque order receipt and public item/status information, not guest identities, dietary notes or other tables.

## Test plan

- End-to-end: Two-context status update.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Integration: guessed ids and cross-table access fail; station/public projections contain no private fields.

## Files likely touched

- `src/modules/ordering/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
