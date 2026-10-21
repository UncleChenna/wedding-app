---
id: TICKET-153
title: Write and rehearse the rollback plan
epic: deployment
status: todo
priority: urgent
estimate: S
labels: [infra, docs]
module: ops
owner: ""
agent: ""
blocked_by: [TICKET-179, TICKET-152]
blocks: [TICKET-154, TICKET-161, TICKET-176]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-153: Write and rehearse the rollback plan

## Context

On the day, a bad deploy must be undone in under 2 minutes.

See: [Performance and reliability](../docs/prd.md#performance-and-reliability).

## Scope

- Instant rollback via Vercel; migration compatibility rules; rehearsal on staging.

## Out of scope

- Blue/green.

## Acceptance criteria

- [ ] Rehearse application rollback within two minutes using the previous deployment against the current schema; record elapsed time and smoke results.
- [ ] Expand/contract migrations preserve the previous application contract; incompatible changes require a documented maintenance/roll-forward decision.
- [ ] Routine rollback never restores an old database over new orders/check-ins; data recovery uses TICKET-179 approved RPO/RTO.
- [ ] Full wedding-day release additionally verifies old/new service workers and pending queues through TICKET-180.

## Test plan

- Manual: Rehearsal.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/runbook.md`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
