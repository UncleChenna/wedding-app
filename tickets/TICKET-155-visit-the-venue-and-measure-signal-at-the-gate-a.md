---
id: TICKET-155
title: Visit the venue and measure signal at the gate and hall
epic: launch
status: todo
priority: high
estimate: S
labels: [human]
module: ops
owner: ""
agent: ""
blocked_by: []
blocks: [TICKET-156, TICKET-161]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-155: Visit the venue and measure signal at the gate and hall

## Context

The PRD asks for a venue visit before week 6 to measure signal and plan the router.

See: [Connectivity plan](../docs/prd.md#connectivity-plan-signal-unknown).

## Scope

- Speed tests on each network at the gate and hall; power sockets; lighting at the gate.

## Out of scope

- Buying kit (TICKET-156).

## Acceptance criteria

- [ ] Measurements (down/up/latency per network and spot) recorded in docs/runbook.md.

## Test plan

- Manual: Venue visit.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/runbook.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
