---
id: WED-137
title: Load test 350 guests at the gate and 30 tables ordering
epic: testing
status: todo
priority: high
estimate: L
labels: [test, infra]
module: shared
owner: ""
agent: ""
blocked_by: [WED-068, WED-073, WED-149]
blocks: [WED-163]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-137: Load test 350 guests at the gate and 30 tables ordering

## Context

All guests scanned within 45 minutes across 3 devices; 30 tables ordering within the same 5 minutes; scan <1s, order-to-board <2s.

See: [Testing plan](../docs/prd.md#testing-plan) · [Performance and reliability](../docs/prd.md#performance-and-reliability).

## Scope

- k6 or Playwright-driven script against a staging deployment with the load seed.
- Report p50/p95 timings and errors.

## Out of scope

- Production load.

## Acceptance criteria

- [ ] p95 scan-to-result <1s and order-to-board <2s at target load (report in docs/audits/).
- [ ] Zero failed orders or lost check-ins.

## Test plan

- Manual: Run against staging.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `scripts/load/`
- `docs/audits/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
