---
id: TICKET-076
title: Build the kitchen board with oldest-first live orders
epic: ordering
status: todo
priority: high
estimate: L
labels: [frontend]
module: ordering
owner: ""
agent: ""
blocked_by: [TICKET-019, TICKET-031, TICKET-033, TICKET-074, TICKET-128]
blocks: [TICKET-077, TICKET-078, TICKET-087, TICKET-112]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-076: Build the kitchen board with oldest-first live orders

## Context

Kitchen staff see incoming orders by table, oldest first, with a sound alert on new orders, readable at arm's length on a tablet.

See: [Table ordering](../docs/prd.md#table-ordering) (ORD-4) · [Users and roles](../docs/prd.md#users-and-roles) · [Design principles (repo)](../docs/design-principles.md).

## Scope

- Board at /kitchen behind a kitchen PIN; order cards with table (≥32px), items, notes, dietary notes, age.
- Sound on new orders after a user gesture unlocks audio.
- Wake lock where supported.

## Out of scope

- Status buttons (TICKET-078).

## Acceptance criteria

- [ ] New orders appear oldest-first within 2s (e2e).
- [ ] A new order plays a sound when audio is unlocked and shows a visual flash regardless.
- [ ] Board is legible at 1 metre on a tablet (manual).

## Test plan

- End-to-end: Realtime order arrival.
- Manual: Tablet legibility check.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/(staff)/kitchen/`
- `src/modules/ordering/components/board.tsx`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
