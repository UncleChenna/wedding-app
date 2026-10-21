---
id: WED-095
title: Build the menu editor with a live sold-out toggle
epic: admin
status: todo
priority: urgent
estimate: M
labels: [frontend, backend]
module: admin
owner: ""
agent: ""
blocked_by: [WED-024, WED-088]
blocks: [WED-134, WED-157]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-095: Build the menu editor with a live sold-out toggle

## Context

ADM-4: the couple set the menu; items can be marked sold out live.

See: [Admin dashboard](../docs/prd.md#admin-dashboard) (ADM-4) · [Table ordering](../docs/prd.md#table-ordering) (ORD-2).

## Scope

- CRUD for items: name, category, station, available, max_per_order, sort, optional photo.

## Out of scope

- Order page.

## Acceptance criteria

- [ ] Sold-out toggle updates the order page within 5s (e2e).
- [ ] Validation prevents an item without a station.

## Test plan

- Unit: Validation.
- End-to-end: Toggle sold out.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
