---
id: WED-136
title: Test the gate end to end with the network switched off
epic: testing
status: todo
priority: urgent
estimate: M
labels: [test, pwa]
module: checkin
owner: ""
agent: ""
blocked_by: [WED-066, WED-067, WED-108]
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

# WED-136: Test the gate end to end with the network switched off

## Context

Hardening: a full check-in test with the network off is a PRD milestone.

See: [Gate check-in](../docs/prd.md#gate-check-in) (CHK-6) · [Milestones, scope and testing](../docs/prd.md#milestones-scope-and-testing).

## Scope

- Scripted: sign in, go offline, reload, scan 50 codes on two contexts, reconnect, verify counts and conflicts.

## Out of scope

- Real devices (WED-163).

## Acceptance criteria

- [ ] Counts on the server equal admissions made offline; conflicts flagged; runs in CI.

## Test plan

- End-to-end: Offline gate spec.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `e2e/offline-gate.spec.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
