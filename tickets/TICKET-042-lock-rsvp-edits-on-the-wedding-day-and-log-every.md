---
id: TICKET-042
title: Lock RSVP edits on the wedding day and log every change
epic: invitations
status: todo
priority: urgent
estimate: M
labels: [backend, frontend]
module: invitations
owner: ""
agent: ""
blocked_by: [TICKET-025, TICKET-041, TICKET-034]
blocks: [TICKET-100, TICKET-131, TICKET-176]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-042: Lock RSVP edits on the wedding day and log every change

## Context

Guests can edit until the wedding day, when it locks; the admin sees each change with a timestamp.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-6) · [On the website](../docs/prd.md#on-the-website).

## Scope

- Server-side lock using rsvp_lock_at in the event time zone.
- Every RSVP/tag-along change writes an rsvp_changes row.
- Locked state shows "The big day is here…".

## Out of scope

- Admin history UI (TICKET-100).

## Acceptance criteria

- [ ] After rsvp_lock_at, every RSVP mutation is rejected server-side (unit test with a fake clock).
- [ ] Each change writes before/after JSON with a timestamp.
- [ ] Locked IVs still show the QR pass.

- [ ] Enforce the approved event timezone/lock boundary on the server, log previous/new values and timestamp, and apply the approved pass-version rule when party size changes.

- [ ] Missing or invalid event time zone rejects live lock configuration; a development/test time zone is never substituted for the TBD venue time zone.

## Test plan

- Unit: Lock and change-log tests with fake time.
- End-to-end: Locked fixture shows the locked copy.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Integration: one millisecond before/at/after lock, timezone/DST boundary, concurrent edits and changed signed-pass party size.

## Files likely touched

- `src/modules/invitations/server/`

## Notes / decisions

- 2026-10-26: Owner approved event-local midnight on 2026-12-19; exact UTC rsvp_lock_at remains unset until venue time zone is configured. See docs/prd.md#approved-event-defaults.

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
