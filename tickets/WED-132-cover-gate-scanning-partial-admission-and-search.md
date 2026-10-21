---
id: WED-132
title: Cover gate scanning, partial admission and search end to end
epic: testing
status: todo
priority: high
estimate: M
labels: [test]
module: checkin
owner: ""
agent: ""
blocked_by: [WED-062, WED-063]
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

# WED-132: Cover gate scanning, partial admission and search end to end

## Context

Journey 2 must never break.

See: [Journey 2: check-in at the gate](../docs/prd.md#journey-2-check-in-at-the-gate).

## Scope

- Fake camera scans for every result type, partial admission, manual search.

## Out of scope

- Offline (WED-136).

## Acceptance criteria

- [ ] All five result types and partial admission pass in CI.

## Test plan

- End-to-end: Gate spec.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `e2e/gate.spec.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
