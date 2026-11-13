---
id: TICKET-132
title: Cover gate scanning, partial admission and search end to end
epic: testing
status: in_progress
priority: high
estimate: M
labels: [test]
module: checkin
owner: divine
agent: codex
blocked_by: [TICKET-062, TICKET-063]
blocks: [TICKET-154]
branch: TICKET-132
pr: ""
created: 2026-10-21
updated: 2026-11-13
started: 2026-11-13
completed: ""
reason: ""
resume_to: ""
---

# TICKET-132: Cover gate scanning, partial admission and search end to end

## Context

Journey 2 must never break.

See: [Journey 2: check-in at the gate](../docs/prd.md#journey-2-check-in-at-the-gate).

## Scope

- Fake camera scans for every result type, partial admission, manual search.

## Out of scope

- Offline (TICKET-136).

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
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
