---
id: WED-052
title: Fill share messages from the PRD wording templates
epic: sharing
status: todo
priority: high
estimate: S
labels: [backend, docs]
module: invitations
owner: ""
agent: ""
blocked_by: [WED-050]
blocks: [WED-158]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-052: Fill share messages from the PRD wording templates

## Context

Messages use one voice with {GuestName}, {Couple} and {Link} placeholders.

See: [Invitation wording](../docs/prd.md#invitation-wording).

## Scope

- Template module for invitation, email, RSVP nudge and day-before messages.
- Voice selectable in settings; default warm until WED-035 decides.

## Out of scope

- Choosing the voice (WED-035).

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
