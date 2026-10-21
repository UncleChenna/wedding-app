---
id: WED-100
title: Show each invitation's RSVP change history
epic: admin
status: todo
priority: medium
estimate: S
labels: [frontend]
module: admin
owner: ""
agent: ""
blocked_by: [WED-042, WED-089]
blocks: [WED-154]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-100: Show each invitation's RSVP change history

## Context

INV-6: admin sees each change with a timestamp.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-6).

## Scope

- Timeline per invitation from rsvp_changes.

## Out of scope

- Undo.

## Acceptance criteria

- [ ] Every change for a seeded invitation is listed newest first with time (e2e).

## Test plan

- End-to-end: History view.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
