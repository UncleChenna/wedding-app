---
id: TICKET-130
title: Enforce coverage on critical logic
epic: testing
status: todo
priority: high
estimate: M
labels: [test]
module: shared
owner: ""
agent: ""
blocked_by: [TICKET-056, TICKET-058, TICKET-073]
blocks: [TICKET-154]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-130: Enforce coverage on critical logic

## Context

Token validation and admission counting are the logic that must never be wrong.

See: [Testing plan](../docs/prd.md#testing-plan).

## Scope

- Vitest coverage thresholds (≥95% lines/branches) for checkin/lib, invitations/lib token, ordering limits.

## Out of scope

- Global thresholds.

## Acceptance criteria

- [ ] `pnpm test` fails when critical-module coverage drops below 95%.

## Test plan

- Unit: Coverage config.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `vitest.config.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
