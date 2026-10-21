---
id: WED-026
title: Rebuild deterministic seed data for the new schema
epic: data-auth
status: todo
priority: high
estimate: M
labels: [db, test]
module: shared
owner: ""
agent: ""
blocked_by: [WED-024, WED-025]
blocks: [WED-127]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-026: Rebuild deterministic seed data for the new schema

## Context

Seed data must match the redesigned schema and cover realistic edge cases for development and the load test.

See: [Performance and reliability](../docs/prd.md#performance-and-reliability) · [Data model](../docs/prd.md#data-model).

## Scope

- Default profile (~110 invitations / ~250 guests) and a `--profile load` with 350 guests, 30 tables, full menu.
- Edge cases: revoked IV, declined, partial admission, sold-out item.
- Deterministic with a fixed faker seed.

## Out of scope

- Real guest data (WED-157).

## Acceptance criteria

- [ ] Seeding twice yields identical rows (hash compared in a test).
- [ ] Load profile produces exactly 350 guests across 30 tables.
- [ ] Every edge case above exists in the default profile.

## Test plan

- Unit: seed-data tests.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `scripts/seed-data.ts`
- `scripts/seed.ts`
- `scripts/__tests__/seed-data.test.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
