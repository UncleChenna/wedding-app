---
id: WED-053
title: Show a reminder list and re-share nudges to non-responders
epic: sharing
status: todo
priority: medium
estimate: M
labels: [frontend, backend]
module: admin
owner: ""
agent: ""
blocked_by: [WED-051, WED-089, WED-052]
blocks: [WED-054]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-053: Show a reminder list and re-share nudges to non-responders

## Context

INV-8 (Could): the admin sees who hasn't RSVP'd and re-shares with a pre-written reminder.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-8) · [Invitation wording](../docs/prd.md#invitation-wording).

## Scope

- List of sent-but-unanswered IVs with last-shared time.
- Share menu prefilled with the RSVP nudge; re-share logged.

## Out of scope

- Automatic reminders.

## Acceptance criteria

- [ ] The list shows exactly the invitations with status sent and no RSVP (unit query test).
- [ ] Re-sharing records a reminder event.

## Test plan

- Unit: Query.
- End-to-end: Reminder share flow.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
