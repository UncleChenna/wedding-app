---
id: WED-041
title: Let guests add tag-alongs with meals and dietary notes
epic: invitations
status: todo
priority: urgent
estimate: L
labels: [frontend, backend]
module: invitations
owner: ""
agent: ""
blocked_by: [WED-040, WED-171]
blocks: [WED-042, WED-117, WED-131, WED-138, WED-158]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-041: Let guests add tag-alongs with meals and dietary notes

## Context

Guests add their tag-alongs by name, up to the per-IV limit, with a meal choice and dietary notes for each person.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-4) · [On the website](../docs/prd.md#on-the-website).

## Scope

- "Who's walking in with you?" list: add, edit, remove up to max_tag_alongs.
- Meal choice from the menu's meals; dietary notes per person.
- count_attending derived from the list.

## Out of scope

- Admin view of changes (WED-100).

## Acceptance criteria

- [ ] The server rejects more tag-alongs than max_tag_alongs (unit + e2e).
- [ ] Each person stores name, meal choice and dietary notes; names are required.
- [ ] Removing a tag-along updates count_attending.

## Test plan

- Unit: Limit and count logic.
- End-to-end: Add two, remove one, reload.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/invitations/components/`
- `src/modules/invitations/server/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
