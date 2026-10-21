---
id: WED-024
title: Redesign check-in, menu, order and staff tables to match the PRD
epic: data-auth
status: todo
priority: urgent
estimate: L
labels: [db, backend]
module: shared
owner: ""
agent: ""
blocked_by: [WED-023]
blocks: [WED-026, WED-027, WED-031, WED-058, WED-061, WED-069, WED-070, WED-084, WED-095]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-024: Redesign check-in, menu, order and staff tables to match the PRD

## Context

Check-ins are unique per guest today (no partial admission, no failed-scan log); menu categories, order statuses and staff roles differ from the PRD.

See: [Data model](../docs/prd.md#data-model) · [Gate check-in](../docs/prd.md#gate-check-in) (CHK-3, CHK-5) · [Table ordering](../docs/prd.md#table-ordering) (ORD-2, ORD-5) · [Users and roles](../docs/prd.md#users-and-roles).

## Scope

- check_ins per invitation: people_admitted, result, device_id, staff_id, scanned_at, client_event_id (unique).
- scan_log for every scan, including invalid ones.
- menu_items: category meal/soft_drink/alcohol, station, available, max_per_order.
- orders: status received/preparing/served/cancelled, station.
- staff: role gate/kitchen/bar/host, whatsapp_number, pin_hash, expires_at, alerts_opt_in.
- devices table for scanners and boards.

## Out of scope

- Settings and audit tables (WED-025).

## Acceptance criteria

- [ ] A DB constraint or trigger prevents sum(people_admitted) exceeding count_attending.
- [ ] client_event_id uniqueness makes repeated syncs idempotent (tested).
- [ ] Migration generated, applied twice cleanly.

## Test plan

- Unit: Constraint and idempotency tests against the local stack.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/server/db/schema.ts`
- `drizzle/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
