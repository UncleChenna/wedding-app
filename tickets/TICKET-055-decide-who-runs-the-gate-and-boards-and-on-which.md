---
id: TICKET-055
title: Decide who runs the gate and boards, and on which devices
epic: checkin
status: todo
priority: urgent
estimate: S
labels: [human]
module: ops
owner: ""
agent: ""
blocked_by: []
blocks: [TICKET-057, TICKET-114, TICKET-138, TICKET-161, TICKET-162]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-055: Decide who runs the gate and boards, and on which devices

## Context

Open question. Device models and browsers decide which camera API and install path we must test.

See: [Open questions](../docs/prd.md#open-questions) · [Performance and reliability](../docs/prd.md#performance-and-reliability).

## Scope

- Names and roles for gate, kitchen and bar.
- Device list (OS, browser version) for 3 scanners, 2 boards, 1 backup.

## Out of scope

- Training (TICKET-162).

## Acceptance criteria

- [ ] docs/current-state.md assumption 15 is confirmed or changed.
- [ ] A device table with OS and browser versions is recorded in docs/runbook.md.

## Test plan

- Manual: Couple and caterer decide.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/current-state.md`
- `docs/runbook.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
