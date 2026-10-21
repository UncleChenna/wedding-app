---
id: TICKET-151
title: Configure database and media backups with failure alerts
epic: deployment
status: todo
priority: urgent
estimate: M
labels: [infra, db]
module: ops
owner: ""
agent: ""
blocked_by: [TICKET-144, TICKET-149]
blocks: [TICKET-168, TICKET-179]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-151: Configure database and media backups with failure alerts

## Context

Guest data and check-ins must survive a mistake on the day.

See: [Performance and reliability](../docs/prd.md#performance-and-reliability).

## Scope

- Configure scheduled encrypted database and media backups, retention, access controls and failure alerts. The timed isolated restore and verification are TICKET-179.

## Out of scope

- Continuous replication.

## Acceptance criteria

- [ ] Scheduled backups include database and referenced media, with documented retention, access controls and recoverable secret/config references.
- [ ] A deliberately failed backup produces an actionable alert; a successful run records time and inventory without personal data.
- [ ] TICKET-179 can restore a selected backup to an isolated target; this ticket does not claim restore success before that rehearsal.

- [ ] Backup failure alerts and an inventory must cover database and media independently; row-count-only verification is not a restore drill. TICKET-179 proves recovery.

## Test plan

- Integration: schedule a synthetic database/media backup and inject a failed job; verify inventory and alert delivery.
- Manual: review encryption, access, retention and recovery references. Timed restore verification belongs to TICKET-179.

## Files likely touched

- `scripts/backup.mjs`
- `docs/runbook.md`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
