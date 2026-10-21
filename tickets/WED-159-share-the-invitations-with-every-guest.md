---
id: WED-159
title: Share the invitations with every guest
epic: launch
status: todo
priority: high
estimate: M
labels: [human]
module: ops
owner: ""
agent: ""
blocked_by: [WED-051, WED-138, WED-157, WED-158]
blocks: []
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-159: Share the invitations with every guest

## Context

End of the invitations phase: every guest receives their personal link.

See: [Journey 1: receiving the IV and RSVP](../docs/prd.md#journey-1-receiving-the-iv-and-rsvp) · [Milestones, scope and testing](../docs/prd.md#milestones-scope-and-testing).

## Scope

- Share each IV via the Share menu; track sent status; follow up bounces.

## Out of scope

- Reminders (WED-053).

## Acceptance criteria

- [ ] Every invitation has status sent (dashboard screenshot).

## Test plan

- Manual: Couple shares.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/runbook.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
