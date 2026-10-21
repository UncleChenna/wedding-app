---
id: WED-159
title: Share the invitations with every guest
epic: launch
status: todo
priority: urgent
estimate: M
labels: [human]
module: ops
owner: ""
agent: ""
blocked_by: [WED-051, WED-138, WED-177, WED-158, WED-176]
blocks: [WED-164]
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

- [ ] Every eligible invitation has a recorded first-send event/timestamp or an owner-approved exception; declined/revoked invitations are not automatically resent.
- [ ] Sharing never resets an existing RSVP status, and cancelled native shares are not counted as sent.
- [ ] Owner approves batches after WED-177 import reconciliation and WED-158 proofread; delivery failures have a private follow-up list.

## Test plan

- Manual: Couple shares.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/runbook.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
