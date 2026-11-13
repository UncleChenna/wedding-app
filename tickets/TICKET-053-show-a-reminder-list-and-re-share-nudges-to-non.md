---
id: TICKET-053
title: Show a reminder list and re-share nudges to non-responders
epic: sharing
status: done
priority: medium
estimate: M
labels: [frontend, backend]
module: admin
owner: divine
agent: codex
blocked_by: [TICKET-051, TICKET-089, TICKET-052]
blocks: [TICKET-054]
branch: TICKET-053
pr: https://github.com/UncleChenna/wedding-app/pull/129
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-053: Show a reminder list and re-share nudges to non-responders

## Context

INV-8 (Could): the admin sees who hasn't RSVP'd and re-shares with a pre-written reminder.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-8) · [Invitation wording](../docs/prd.md#invitation-wording).

## Scope

- List of sent-but-unanswered IVs with last-shared time.
- Share menu prefilled with the RSVP nudge; re-share logged.

## Out of scope

- Automatic reminders.

## Acceptance criteria

- [x] The list shows exactly the invitations with status sent and no RSVP (unit query test).
- [x] Re-sharing records a reminder event.

## Test plan

- Unit: Query.
- End-to-end: Reminder share flow.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

- 2026-11-09 — Added authorized `/admin/sharing/reminders`, exact sent/no-RSVP query and approved Warm nudge via existing share menu. A reminder is a recorded user-triggered attempt, never confirmed delivery; Copy link remains link-only.
- New additive migration0022 records purpose without recipient/body/link data. Invitation row locking rechecks eligibility and version, receipt replay is purpose-scoped, Undo preserves later replies and original sent time.
- Verification: 8 isolated database tests (3 reminder +5 existing sharing), repeat migration/seed counts unchanged,23RLS checks,162 related unit tests, lint/types, production build and authenticated browser1/1 pass. Four-theme axe and375/600/768/1280 overflow pass; two375px screenshots inspected. Physical devices/external delivery remain release checks in TICKET-201. Full CI remains merge gate.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — divine (codex)
- 2026-11-09 — todo → in_progress — divine (codex)
- 2026-11-09 — in_progress → in_review — divine (codex)
