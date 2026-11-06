---
id: TICKET-086
title: Manage alert opt-ins and recipients per station
epic: alerts
status: in_progress
priority: medium
estimate: S
labels: [frontend, backend]
module: admin
owner: unclechenna
agent: claude
blocked_by: [TICKET-084, TICKET-096, TICKET-049]
blocks: [TICKET-085]
branch: TICKET-086
pr: ""
created: 2026-10-21
updated: 2026-11-06
started: 2026-11-06
completed: ""
reason: ""
resume_to: ""
---

# TICKET-086: Manage alert opt-ins and recipients per station

## Context

Only staff who opted in receive alerts, routed by kitchen or bar role.

See: [ORD-9 WhatsApp order alerts](../docs/prd.md#ord-9--whatsapp-order-alerts-must).

## Scope

- Opt-in toggle and WhatsApp number on the staff form; normalised to E.164.

## Out of scope

- Self-service opt-in.

## Acceptance criteria

- [ ] Only opted-in staff of the matching station are recipients (unit).

## Test plan

- Unit: Recipient query.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-06 — todo → claimed — unclechenna (claude)
- 2026-11-06 — todo → in_progress — unclechenna (claude)
