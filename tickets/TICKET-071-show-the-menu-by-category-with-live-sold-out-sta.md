---
id: TICKET-071
title: Show the menu by category with live sold-out state
epic: ordering
status: in_progress
priority: high
estimate: M
labels: [frontend, backend]
module: ordering
owner: unclechenna
agent: claude
blocked_by: [TICKET-070]
blocks: [TICKET-072]
branch: TICKET-071
pr: ""
created: 2026-10-21
updated: 2026-11-03
started: 2026-11-03
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

- [x] Marking an item sold out in admin disables it on an open order page within 5s (e2e).
- [x] Sold-out state is announced with text.
- [x] Menu renders in every theme at 375px without overflow.

- [x] Live availability changes remove sold-out items from new choices; the server still revalidates items at commit time. Use seeded menu fixtures until TICKET-095 exists.

## Test plan

- End-to-end: Sold-out live update.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: End-to-end: menu changes after loading and before submission; stale cart gets a clear recoverable error.

## Files likely touched

- `src/modules/ordering/components/`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-03:
  - **"In admin".** The admin menu control is TICKET-095. As the last criterion allows, the browser test flips
    `menu_items.is_available` in the database directly; any writer, admin included, reaches the page the same way.
  - **Polling, not Realtime.** 3-second polling of `GET /api/menu/availability` while the tab is visible. Realtime on
    `menu_items` would need an anonymous read policy, which is an RLS change requiring an ADR.
  - **Commit-time revalidation** belongs to order submission (TICKET-074). This ticket only displays availability
    and clears sold-out choices locally. The stale-cart audit check moves with the cart (TICKET-072/074).
  - **Photos deferred.** `menu_items` has no image column; adding one needs a migration and its own ticket.
  - **Lighthouse not verified at 95.** 88–97 under heavy machine load; the unchanged table form scored the same at
    the same time (`docs/reviews/TICKET-071/performance.json`).

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-03 — todo → claimed — unclechenna (claude)
- 2026-11-03 — todo → in_progress — unclechenna (claude)
