---
id: WED-094
title: Print table cards with the shared order QR and Wi-Fi details
epic: admin
status: todo
priority: high
estimate: M
labels: [frontend, design]
module: admin
owner: ""
agent: ""
blocked_by: [WED-011, WED-093]
blocks: [WED-160]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-094: Print table cards with the shared order QR and Wi-Fi details

## Context

Every table card shows its number, the one shared order QR, and the router's Wi-Fi name and password.

See: [Admin dashboard](../docs/prd.md#admin-dashboard) (ADM-2) · [Connectivity plan](../docs/prd.md#connectivity-plan-signal-unknown).

## Scope

- Print-optimised themed cards (A6/A5) for all tables.
- QR to /order with quiet zone; Wi-Fi details from settings.

## Out of scope

- Printing (WED-160).

## Acceptance criteria

- [ ] The QR on a printed card decodes to the /order URL (rasterised test).
- [ ] One card per table, numbers correct (unit).

## Test plan

- Unit: Card data.
- Manual: Print one and scan it.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
