---
id: WED-133
title: Cover table ordering to the boards end to end
epic: testing
status: todo
priority: high
estimate: M
labels: [test]
module: ordering
owner: ""
agent: ""
blocked_by: [WED-075, WED-077, WED-078]
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

# WED-133: Cover table ordering to the boards end to end

## Context

Journey 3 must never break.

See: [Journey 3: ordering from the table](../docs/prd.md#journey-3-ordering-from-the-table).

## Scope

- Order → kitchen and bar boards → served → guest sees status; limits.

## Out of scope

- Load (WED-137).

## Acceptance criteria

- [ ] The journey passes in CI with two browser contexts.

## Test plan

- End-to-end: Order spec.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `e2e/order.spec.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
