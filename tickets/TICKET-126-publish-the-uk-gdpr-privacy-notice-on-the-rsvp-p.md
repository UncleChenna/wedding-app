---
id: TICKET-126
title: Publish the UK GDPR privacy notice on the RSVP page
epic: security
status: todo
priority: urgent
estimate: M
labels: [frontend, docs, security]
module: invitations
owner: ""
agent: ""
blocked_by: [TICKET-040, TICKET-122]
blocks: [TICKET-154, TICKET-176, TICKET-177]
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

## Out of scope

- Cookie banner (no tracking cookies).

## Acceptance criteria

- [ ] The RSVP form links to /privacy (e2e).
- [ ] Notice states the agreed retention period and controller contact.

## Test plan

- End-to-end: Link present.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/(guest)/privacy/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
