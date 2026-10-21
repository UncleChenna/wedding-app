---
id: TICKET-082
title: Add the optional table host view for a section's tables
epic: ordering
status: backlog
priority: low
estimate: M
labels: [frontend]
module: ordering
owner: ""
agent: ""
blocked_by: [TICKET-078]
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

# TICKET-082: Add the optional table host view for a section's tables

## Context

Optional role: a waiter per section sees orders for their tables only and marks them delivered.

See: [Users and roles](../docs/prd.md#users-and-roles).

## Scope

- Host PIN with assigned tables; filtered board.

## Out of scope

- Seating changes.

## Acceptance criteria

- [ ] A host sees only orders for assigned tables (e2e).
- [ ] Hosts can mark served but not cancel (unit).

## Test plan

- End-to-end: Filtered board.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/ordering/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → backlog — UncleChenna (claude) — created from the PRD and docs/current-state.md
