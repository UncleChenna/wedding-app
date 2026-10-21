---
id: TICKET-131
title: Cover the invitation, RSVP and pass journey end to end
epic: testing
status: todo
priority: urgent
estimate: M
labels: [test]
module: invitations
owner: ""
agent: ""
blocked_by: [TICKET-041, TICKET-042, TICKET-044, TICKET-045, TICKET-046]
blocks: [TICKET-154, TICKET-176]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-131: Cover the invitation, RSVP and pass journey end to end

## Context

Journey 1 must never break.

See: [Journey 1: receiving the IV and RSVP](../docs/prd.md#journey-1-receiving-the-iv-and-rsvp).

## Scope

- Open IV → RSVP yes → tag-alongs → pass → edit → lock, tagged @smoke where fast.

## Out of scope

- Visual checks.

## Acceptance criteria

- [ ] The journey passes on mobile and desktop projects in CI.

## Test plan

- End-to-end: Journey spec.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `e2e/guest.spec.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
