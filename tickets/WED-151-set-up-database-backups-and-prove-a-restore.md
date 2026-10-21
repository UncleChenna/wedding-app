---
id: WED-151
title: Set up database backups and prove a restore
epic: deployment
status: todo
priority: high
estimate: M
labels: [infra, db]
module: ops
owner: ""
agent: ""
blocked_by: [WED-144]
blocks: [WED-153]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-151: Set up database backups and prove a restore

## Context

Guest data and check-ins must survive a mistake on the day.

See: [Performance and reliability](../docs/prd.md#performance-and-reliability).

## Scope

- Daily backups (plan-dependent) plus a scripted pg_dump to private storage before the day.
- Restore into a scratch project and compare counts.

## Out of scope

- Continuous replication.

## Acceptance criteria

- [ ] A restore test into a scratch project matches row counts (evidence in notes).
- [ ] Restore steps in docs/runbook.md.

## Test plan

- Manual: Restore drill.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `scripts/backup.mjs`
- `docs/runbook.md`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
