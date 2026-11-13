---
id: TICKET-051
title: Mark invitations as sent when shared
epic: sharing
status: done
priority: urgent
estimate: S
labels: [backend, frontend]
module: admin
owner: unclechenna
agent: codex
blocked_by: [TICKET-050, TICKET-089]
blocks: [TICKET-053, TICKET-159, TICKET-176]
branch: TICKET-051
pr: https://github.com/UncleChenna/wedding-app/pull/116
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-051: Mark invitations as sent when shared

## Context

Sharing marks the IV as sent so the couple knows who still needs one.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-3).

## Scope

- Status draft → sent and sent_at on first share; each share logged with channel.
- Undo for mis-taps.

## Out of scope

- Delivery receipts (not possible without a provider).

## Acceptance criteria

- [x] Sharing through any channel sets status sent and sent_at once (unit).
- [x] The guest list filters by sent / not sent.

- [x] First-send timestamp is separate from RSVP status. Re-sharing preserves yes/no responses and revocation; cancelling native share does not mark sent, and opening an external intent is not proof of delivery.

## Test plan

- Unit: Status transition.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Unit: first share, repeat share after RSVP, revoked invitation and native-share cancellation; assert no RSVP mutation.

## Files likely touched

- `src/modules/admin/server/`

## Notes / decisions

2026-11-09 — Sharing/Undo implementation verified with policy/component tests, five isolated PostgreSQL cases and authenticated mobile/desktop journeys. Generated migration0020 and detailed evidence are in docs/plans/TICKET-051-pr.md. Native-device release QA remains unverified; PR stays draft pending prerequisite089 and final review.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — unclechenna (codex) — started ahead of TICKET-089 (in_progress)
- 2026-11-09 — todo → in_progress — unclechenna (codex) — started ahead of TICKET-089 (in_progress)
- 2026-11-09 — in_progress → in_review — unclechenna (codex)
