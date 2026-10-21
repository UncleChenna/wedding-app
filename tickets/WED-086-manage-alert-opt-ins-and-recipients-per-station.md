---
id: WED-086
title: Manage alert opt-ins and recipients per station
epic: alerts
status: todo
priority: medium
estimate: S
labels: [frontend, backend]
module: admin
owner: ""
agent: ""
blocked_by: [WED-084, WED-096]
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

# WED-086: Manage alert opt-ins and recipients per station

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
