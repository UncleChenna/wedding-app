---
id: TICKET-127
title: Add the data-retention job that deletes guest data on schedule
epic: security
status: todo
priority: high
estimate: M
labels: [backend, security, db]
module: shared
owner: ""
agent: ""
blocked_by: [TICKET-026, TICKET-122]
blocks: [TICKET-154, TICKET-168]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-127: Add the data-retention job that deletes guest data on schedule

## Context

Guest data is deleted a set time after the wedding.

See: [Privacy (UK GDPR)](../docs/prd.md#privacy-uk-gdpr).

## Scope

- Daily job (Vercel cron) deleting personal data after event date + retention_days; keeps anonymous counts.
- Dry-run mode and audit log.

## Out of scope

- Memories export (TICKET-167).

## Acceptance criteria

- [ ] With a fake clock past the cutoff, names, contacts and dietary notes are deleted and counts remain (unit).
- [ ] Before the cutoff the job deletes nothing.

- [ ] Retention covers live rows, audit/change JSON, alert outbox, uploaded portraits, exports and private device caches; backup expiry is documented. Restricted retention deletion is an explicit exception to ordinary append-only audit writes.

## Test plan

- Unit: Deletion with fake time.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Integration: synthetic data past cutoff is removed/redacted across every store while unexpired data remains; manual verify backup/cache expiry procedure.

## Files likely touched

- `src/app/api/cron/retention/route.ts`
- `vercel.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
