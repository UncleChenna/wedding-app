---
id: TICKET-054
title: Prepare the day-before pass reminder batch
epic: sharing
status: in_progress
priority: low
estimate: S
labels: [frontend]
module: admin
owner: divine
agent: codex
blocked_by: [TICKET-053, TICKET-052]
blocks: []
branch: TICKET-054
pr: ""
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-054: Prepare the day-before pass reminder batch

## Context

The PRD drafts a day-before message reminding guests their pass lives at their link.

See: [Invitation wording](../docs/prd.md#invitation-wording).

## Scope

- List of attending invitations with the day-before message in the Share menu.

## Out of scope

- Sending automatically.

## Acceptance criteria

- [ ] The list includes every rsvp_yes invitation and uses the day-before template (unit).

## Test plan

- Unit: Query and template.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — divine (codex) — started ahead of TICKET-053 (in_review)
- 2026-11-09 — todo → in_progress — divine (codex) — started ahead of TICKET-053 (in_review)
