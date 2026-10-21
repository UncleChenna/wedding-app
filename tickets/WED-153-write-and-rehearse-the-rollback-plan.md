---
id: WED-153
title: Write and rehearse the rollback plan
epic: deployment
status: todo
priority: high
estimate: S
labels: [infra, docs]
module: ops
owner: ""
agent: ""
blocked_by: [WED-151, WED-152]
blocks: [WED-154, WED-161]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-153: Write and rehearse the rollback plan

## Context

On the day, a bad deploy must be undone in under 2 minutes.

See: [Performance and reliability](../docs/prd.md#performance-and-reliability).

## Scope

- Instant rollback via Vercel; migration compatibility rules; rehearsal on staging.

## Out of scope

- Blue/green.

## Acceptance criteria

- [ ] Rollback rehearsed on staging in <2 minutes (timing in notes).
- [ ] docs/runbook.md has the steps.

## Test plan

- Manual: Rehearsal.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/runbook.md`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
