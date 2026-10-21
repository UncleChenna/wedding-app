---
id: TICKET-134
title: Cover admin guest import, seating, menu and staff end to end
epic: testing
status: todo
priority: high
estimate: M
labels: [test]
module: admin
owner: ""
agent: ""
blocked_by: [TICKET-091, TICKET-093, TICKET-095, TICKET-096, TICKET-050]
blocks: [TICKET-154]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-134: Cover admin guest import, seating, menu and staff end to end

## Context

The couple's setup work must be reliable.

See: [Admin dashboard](../docs/prd.md#admin-dashboard).

## Scope

- Import CSV, assign seats, edit menu, create staff PIN, share an IV.

## Out of scope

- Theme editor.

## Acceptance criteria

- [ ] The admin journey passes in CI.

## Test plan

- End-to-end: Admin spec.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `e2e/admin.spec.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
