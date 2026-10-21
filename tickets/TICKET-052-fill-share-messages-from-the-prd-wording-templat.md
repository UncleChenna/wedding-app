---
id: TICKET-052
title: Fill share messages from the PRD wording templates
epic: sharing
status: todo
priority: urgent
estimate: S
labels: [backend, docs]
module: invitations
owner: ""
agent: ""
blocked_by: [TICKET-050, TICKET-035, TICKET-025]
blocks: [TICKET-053, TICKET-054, TICKET-158, TICKET-176]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-052: Fill share messages from the PRD wording templates

## Context

Messages use one voice with {GuestName}, {Couple} and {Link} placeholders.

See: [Invitation wording](../docs/prd.md#invitation-wording).

## Scope

- Template module for invitation, email, RSVP nudge and day-before messages.
- Voice selectable in settings; default warm until TICKET-035 decides.

## Out of scope

- Choosing the voice (TICKET-035).

## Acceptance criteria

- [ ] Placeholders are filled and no `{` remains in output (unit, every template).
- [ ] Changing the voice setting changes the generated message.

## Test plan

- Unit: Template rendering.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/invitations/lib/copy.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
