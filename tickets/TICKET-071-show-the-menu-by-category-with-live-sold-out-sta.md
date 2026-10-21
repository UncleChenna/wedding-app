---
id: TICKET-071
title: Show the menu by category with live sold-out state
epic: ordering
status: todo
priority: high
estimate: M
labels: [frontend, backend]
module: ordering
owner: ""
agent: ""
blocked_by: [TICKET-070]
blocks: [TICKET-072]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-071: Show the menu by category with live sold-out state

## Context

Meals, soft drinks and alcoholic drinks, photos optional, items marked sold out live.

See: [Table ordering](../docs/prd.md#table-ordering) (ORD-2).

## Scope

- Category sections; optional item photos via next/image.
- Sold-out items visible but disabled with text, not colour alone.
- Sold-out changes arrive without a reload (polling or realtime).

## Out of scope

- Cart (TICKET-072).

## Acceptance criteria

- [ ] Marking an item sold out in admin disables it on an open order page within 5s (e2e).
- [ ] Sold-out state is announced with text.
- [ ] Menu renders in every theme at 375px without overflow.

- [ ] Live availability changes remove sold-out items from new choices; the server still revalidates items at commit time. Use seeded menu fixtures until TICKET-095 exists.

## Test plan

- End-to-end: Sold-out live update.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: End-to-end: menu changes after loading and before submission; stale cart gets a clear recoverable error.

## Files likely touched

- `src/modules/ordering/components/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
