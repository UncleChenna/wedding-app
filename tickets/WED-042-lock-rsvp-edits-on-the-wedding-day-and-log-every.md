---
id: WED-042
title: Lock RSVP edits on the wedding day and log every change
epic: invitations
status: todo
priority: urgent
estimate: M
labels: [backend, frontend]
module: invitations
owner: ""
agent: ""
blocked_by: [WED-025, WED-041, WED-034]
blocks: [WED-100, WED-131, WED-176]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-042: Lock RSVP edits on the wedding day and log every change

## Context

Guests can edit until the wedding day, when it locks; the admin sees each change with a timestamp.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-6) · [On the website](../docs/prd.md#on-the-website).

## Scope

- Server-side lock using rsvp_lock_at in the event time zone.
- Every RSVP/tag-along change writes an rsvp_changes row.
- Locked state shows "The big day is here…".

## Out of scope

- Admin history UI (WED-100).

## Acceptance criteria

- [ ] After rsvp_lock_at, every RSVP mutation is rejected server-side (unit test with a fake clock).
- [ ] Each change writes before/after JSON with a timestamp.
- [ ] Locked IVs still show the QR pass.

- [ ] Enforce the approved event timezone/lock boundary on the server, log previous/new values and timestamp, and apply the approved pass-version rule when party size changes.

## Test plan

- Unit: Lock and change-log tests with fake time.
- End-to-end: Locked fixture shows the locked copy.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Integration: one millisecond before/at/after lock, timezone/DST boundary, concurrent edits and changed signed-pass party size.

## Files likely touched

- `src/modules/invitations/server/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
