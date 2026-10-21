---
id: WED-081
title: Keep the order page under 200 KB and fast on slow networks
epic: ordering
status: todo
priority: high
estimate: M
labels: [frontend, test]
module: ordering
owner: ""
agent: ""
blocked_by: [WED-075]
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

# WED-081: Keep the order page under 200 KB and fast on slow networks

## Context

The order page must stay under 200 KB so it loads on weak venue signal.

See: [Connectivity plan](../docs/prd.md#connectivity-plan-signal-unknown) · [Performance and reliability](../docs/prd.md#performance-and-reliability).

## Scope

- Measure transfer size; trim client JS; lazy-load photos.
- CI budget check.

## Out of scope

- Other pages' budgets (WED-116).

## Acceptance criteria

- [ ] Total transferred bytes for /order first load ≤200 KB (Playwright measurement in CI).
- [ ] Order-to-board time <2s on emulated slow 4G (e2e).

## Test plan

- End-to-end: Byte budget and timing.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/ordering/`
- `e2e/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
