---
id: WED-179
title: Rehearse database and asset recovery in an isolated target
epic: deployment
status: todo
priority: urgent
estimate: L
labels: [infra, db, test]
module: ops
owner: ""
agent: ""
blocked_by: [WED-150, WED-151]
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

# WED-179: Rehearse database and asset recovery in an isolated target

## Context

Backlog audit coverage: Deployment, backups and recovery. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Prove recovery of both database records and referenced media in an isolated target.

## Out of scope

- Work outside the stated contract; consuming screens and launch operations remain in their linked tickets. No product implementation is part of this audit.

## Acceptance criteria

- [ ] Restore a scheduled backup into an isolated database and asset namespace, never over production; compare row counts, constraints and representative relational queries.
- [ ] Restore media and verify checksums/decoding and database asset references; document recovery of configuration, signing keys and access policies through approved secret storage.
- [ ] Record measured RPO/RTO, named owner approval, recovery steps and failed-backup alerts; report missing assets or configuration as drill failures.
- [ ] Distinguish application rollback from data recovery; do not discard newer production writes or unsynced device queues during a routine app rollback.

## Test plan

- Integration: disposable restore with known rows and media, including a deliberately missing object that must fail verification. Manual: timed recovery rehearsal and approved private evidence location.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- docs/runbooks/; backup and restore tooling

## Notes / decisions

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.

## Activity log

- 2026-10-21 — new → todo — divine
