---
id: TICKET-052
title: Fill share messages from the PRD wording templates
epic: sharing
status: in_progress
priority: urgent
estimate: M
labels: [backend, docs]
module: invitations
owner: divine
agent: codex
blocked_by: [TICKET-050, TICKET-035, TICKET-025]
blocks: [TICKET-053, TICKET-054, TICKET-158, TICKET-176]
branch: TICKET-052
pr: ""
created: 2026-10-21
updated: 2026-10-31
started: 2026-10-31
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
- Consume `invitationVoice` and `invitationMessages` from `src/modules/invitations/lib/copy.ts`; Warm was selected in TICKET-035 on 2026-10-26.
- Voice selectable in settings; use the approved Warm default.

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

2026-10-31: Persisted voice selection required an additive settings migration, so estimate updated to M. Renderer, validated internal persistence helper and seed/default behavior implemented. Owner approved the generated SQL/snapshot/journal and exact-path authorization record after isolated database checks. Full verification and review are pending.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-31 — todo → claimed — divine (codex)
- 2026-10-31 — todo → in_progress — divine (codex)
