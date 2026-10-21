---
id: WED-073
title: Enforce order limits per table, cooldown and item caps
epic: ordering
status: todo
priority: high
estimate: M
labels: [backend, security]
module: ordering
owner: ""
agent: ""
blocked_by: [WED-025, WED-074]
blocks: [WED-079, WED-081, WED-130, WED-133, WED-137]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-073: Enforce order limits per table, cooldown and item caps

## Context

Anyone at a table can order, so max open orders per table, a cooldown and per-item caps stop misuse.

See: [Table ordering](../docs/prd.md#table-ordering) (ORD-6, ORD-8).

## Scope

- Server checks in one transaction: open orders per table, cooldown, max_per_order.
- Friendly messages with the wait time.
- Limits read from settings.

## Out of scope

- IP rate limiting (WED-123).

## Acceptance criteria

- [ ] The 4th open order for a table is refused with defaults (unit).
- [ ] A second order within 60s is refused and states the seconds left.
- [ ] Concurrent submits cannot exceed limits (parallel test).

- [ ] Count a mixed kitchen/bar submission once for table cooldown/open-submission limits; do not double-charge a single guest action. Limits apply across server instances.

## Test plan

- Unit: Limit checks with concurrency.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Integration: concurrent mixed submissions at the threshold and completion/cancellation releasing the limit.

## Files likely touched

- `src/modules/ordering/server/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
