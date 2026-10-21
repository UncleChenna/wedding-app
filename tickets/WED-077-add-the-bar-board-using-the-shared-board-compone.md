---
id: WED-077
title: Add the bar board using the shared board component
epic: ordering
status: todo
priority: high
estimate: S
labels: [frontend]
module: ordering
owner: ""
agent: ""
blocked_by: [WED-076]
blocks: [WED-133]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-077: Add the bar board using the shared board component

## Context

The bar gets its own board for drinks, with a bar PIN.

See: [Table ordering](../docs/prd.md#table-ordering) (ORD-4).

## Scope

- /bar route with station=bar.
- Bar PIN cannot open /kitchen.

## Out of scope

- Separate bar layout.

## Acceptance criteria

- [ ] Drink orders appear only on /bar; food only on /kitchen (e2e).
- [ ] PIN separation tested.

## Test plan

- End-to-end: Routing per station.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/(staff)/bar/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
