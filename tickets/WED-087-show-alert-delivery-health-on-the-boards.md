---
id: WED-087
title: Show alert delivery health on the boards
epic: alerts
status: todo
priority: medium
estimate: S
labels: [frontend]
module: ordering
owner: ""
agent: ""
blocked_by: [WED-076, WED-085]
blocks: [WED-154]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-087: Show alert delivery health on the boards

## Context

If alerts fail, staff should know to watch the tablet.

See: [ORD-9 WhatsApp order alerts](../docs/prd.md#ord-9--whatsapp-order-alerts-must).

## Scope

- Small indicator: last alert sent / failing.

## Out of scope

- Paging.

## Acceptance criteria

- [ ] A recorded failure shows a visible warning with text on the board (e2e).

## Test plan

- End-to-end: Failure indicator.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/ordering/components/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
