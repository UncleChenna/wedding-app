---
id: WED-024
title: Migrate admission counters and scan event tables
epic: data-auth
status: todo
priority: urgent
estimate: M
labels: [db, backend]
module: shared
owner: ""
agent: ""
blocked_by: [WED-023, WED-172]
blocks: [WED-026, WED-027, WED-058, WED-061, WED-069, WED-173]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-024: Migrate admission counters and scan event tables

## Context

Check-ins are unique per guest today (no partial admission, no failed-scan log); menu categories, order statuses and staff roles differ from the PRD.

See: [Data model](../docs/prd.md#data-model) · [Gate check-in](../docs/prd.md#gate-check-in) (CHK-3, CHK-5) · [Table ordering](../docs/prd.md#table-ordering) (ORD-2, ORD-5) · [Users and roles](../docs/prd.md#users-and-roles).

## Scope

- Migrate admission counters and immutable scan-event records, referencing WED-172 staff/devices. Menu/orders are WED-171; staff identities are WED-172.

## Out of scope

- Settings and audit tables (WED-025).

## Acceptance criteria

- [ ] Admission counters and all five scan results have constrained schemas, indexes and staff/device references.
- [ ] A unique client event id supports retry without duplicate rows; unknown-token attempts allow a null invitation reference.
- [ ] Migrate both an empty database and bootstrap schema in disposable tests; retain existing data and prove invalid counts/results are rejected.

## Test plan

- Integration: disposable migration/seed, constraints, unique event ids and foreign keys.
- Manual: review generated SQL and consumer contracts with WED-058 and WED-173.

## Files likely touched

- `src/modules/shared/server/db/schema.ts`
- `drizzle/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
