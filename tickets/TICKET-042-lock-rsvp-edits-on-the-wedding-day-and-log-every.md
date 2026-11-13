---
id: TICKET-042
title: Lock RSVP edits on the wedding day and log every change
epic: invitations
status: done
priority: urgent
estimate: M
labels: [backend, frontend]
module: invitations
owner: divine
agent: codex
blocked_by: [TICKET-025, TICKET-041, TICKET-034]
blocks: [TICKET-100, TICKET-131, TICKET-176]
branch: TICKET-042
pr: https://github.com/UncleChenna/wedding-app/pull/81
created: 2026-10-21
updated: 2026-11-03
started: 2026-11-03
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

- [x] After rsvp_lock_at, every RSVP mutation is rejected server-side (unit test with a fake clock).
- [x] Each change writes before/after JSON with a timestamp.
- [x] Locked IVs still show the QR pass.

- [x] Enforce the approved event timezone/lock boundary on the server, log previous/new values and timestamp, and apply the approved pass-version rule when party size changes.

- [x] Missing or invalid event time zone rejects live lock configuration; a development/test time zone is never substituted for the TBD venue time zone.

## Test plan

- Unit: Lock and change-log tests with fake time.
- End-to-end: Locked fixture shows the locked copy.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Integration: one millisecond before/at/after lock, timezone/DST boundary, concurrent edits and changed signed-pass party size.

## Files likely touched

- `src/modules/invitations/server/`

## Notes / decisions

- 2026-10-26: Owner approved event-local midnight on 2026-12-19; exact UTC rsvp_lock_at remains unset until venue time zone is configured. See docs/prd.md#approved-event-defaults.

2026-11-03 — Implemented locked mutations, atomic history and locked-page/pass behavior. Boundary/database/browser regressions pass; all-theme screenshots reviewed. Full verification passed against develop f5e5db58446363c6a0b4998dea3dbdfa603a43c1: 834 unit tests and 769 browser tests; 54 unit and 165 browser tests skipped by their existing opt-in/project conditions. Draft PR #81 is published. No production time zone inferred.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-03 — todo → claimed — divine (codex)
- 2026-11-03 — todo → in_progress — divine (codex)
- 2026-11-03 — in_progress → in_review — divine (codex)
