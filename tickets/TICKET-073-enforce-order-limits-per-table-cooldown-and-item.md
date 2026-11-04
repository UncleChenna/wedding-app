---
id: TICKET-073
title: Enforce order limits per table, cooldown and item caps
epic: ordering
status: in_progress
priority: high
estimate: M
labels: [backend, security]
module: ordering
owner: unclechenna
agent: claude
blocked_by: [TICKET-025, TICKET-074]
blocks: [TICKET-079, TICKET-081, TICKET-130, TICKET-133, TICKET-137]
branch: TICKET-073
pr: ""
created: 2026-10-21
updated: 2026-11-04
started: 2026-11-04
completed: ""
reason: ""
resume_to: ""
---

# TICKET-073: Enforce order limits per table, cooldown and item caps

## Context

Anyone at a table can order, so max open orders per table, a cooldown and per-item caps stop misuse.

See: [Table ordering](../docs/prd.md#table-ordering) (ORD-6, ORD-8).

## Scope

- Server checks in one transaction: open orders per table, cooldown, max_per_order.
- Friendly messages with the wait time.
- Limits read from settings.

## Out of scope

- IP rate limiting (TICKET-123).

## Acceptance criteria

- [x] The 4th open order for a table is refused with defaults (unit).
- [x] A second order within 60s is refused and states the seconds left.
- [x] Concurrent submits cannot exceed limits (parallel test).

- [x] Count a mixed kitchen/bar submission once for table cooldown/open-submission limits; do not double-charge a single guest action. Limits apply across server instances.

## Test plan

- Unit: Limit checks with concurrency.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Integration: concurrent mixed submissions at the threshold and completion/cancellation releasing the limit.

## Files likely touched

- `src/modules/ordering/server/`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-04:
  - **Where.** Inside `createOrder`'s transaction: the table row is locked `FOR UPDATE` (serializing that table across
    server instances), the replay check runs again after the lock, then cooldown, then open orders, then
    availability and caps. No migration: `event_settings` already holds `max_open_orders_per_table`,
    `order_cooldown_seconds` and `max_item_quantity`.
  - **Open orders** are `received`, `preparing` or `ready`; `served` and `cancelled` free a slot. Status changes come
    with the boards (TICKET-078).
  - **Cooldown default discrepancy, needs the owner.** The schema and shared defaults use **30 seconds**; this ticket
    and current-state assumption 9 say **60**. The code reads the setting, and the 60-second criterion is tested by
    setting it to 60. Changing the stored default needs a migration; otherwise set it in event settings (TICKET-101).
  - **Item cap.** Each item is capped at the smaller of its `max_per_order` and the event-wide `max_item_quantity`.
  - **Evidence.** Database (`RUN_ORDER_SUBMIT_DB_TESTS=1`, 18 passed): 4th open order refused with defaults; served or
    cancelled frees a slot; 60s cooldown refused with 55–60 seconds left; a mixed submission counts once; 8 parallel
    submissions create 1 order (7 cooldown); the global item cap. The parallel duplicate-tap test still gives 1
    created and 5 replayed. Browser: an immediate second order shows the wait in seconds and keeps the choice.
  - **Not here:** IP rate limiting (TICKET-123).

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-04 — todo → claimed — unclechenna (claude)
- 2026-11-04 — todo → in_progress — unclechenna (claude)
