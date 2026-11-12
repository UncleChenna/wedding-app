---
id: TICKET-126
title: Publish the UK GDPR privacy notice on the RSVP page
epic: security
status: todo
priority: urgent
estimate: L
labels: [frontend, docs, security]
module: invitations
owner: ""
agent: ""
blocked_by: [TICKET-040, TICKET-122, TICKET-026]
blocks: [TICKET-154, TICKET-176, TICKET-177, TICKET-168]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-126: Publish the UK GDPR privacy notice on the RSVP page

## Context

The PRD requires a privacy notice on the RSVP page.

See: [Privacy (UK GDPR)](../docs/prd.md#privacy-uk-gdpr).

## Scope

- /privacy page in plain language; link beside the RSVP form; what we collect, why, who sees it, retention, rights, contact.
- Merged from TICKET-127 (Add the data-retention job that deletes guest data on schedule):
  - Daily job (Vercel cron) deleting personal data after event date + retention_days; keeps anonymous counts.
  - Dry-run mode and audit log.

## Out of scope

- Cookie banner (no tracking cookies).

## Acceptance criteria

- [ ] The RSVP form links to /privacy (e2e).
- [ ] Notice states the agreed retention period and controller contact.
- [ ] (from TICKET-127) With a fake clock past the cutoff, names, contacts and dietary notes are deleted and counts remain (unit).
- [ ] (from TICKET-127) Before the cutoff the job deletes nothing.
- [ ] (from TICKET-127) Retention covers live rows, audit/change JSON, alert outbox, uploaded portraits, exports and private device caches; backup expiry is documented. Restricted retention deletion is an explicit exception to ordinary append-only audit writes.

## Test plan

- End-to-end: Link present.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).
- (TICKET-127) Unit: Deletion with fake time.
- (TICKET-127) Audit verification: Integration: synthetic data past cutoff is removed/redacted across every store while unexpired data remains; manual verify backup/cache expiry procedure.

## Files likely touched

- `src/app/(guest)/privacy/`

## Notes / decisions

_Agents append dated notes here while working._
- 2026-11-12 (unclechenna, claude): TICKET-228 merged TICKET-127 into this ticket (all unstarted) to cut per-ticket overhead. Their scope, criteria and dependencies are above; the merged tickets are cancelled.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
