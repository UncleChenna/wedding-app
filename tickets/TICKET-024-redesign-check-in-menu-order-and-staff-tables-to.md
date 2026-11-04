---
id: TICKET-024
title: Migrate admission counters and scan event tables
epic: data-auth
status: in_progress
priority: urgent
estimate: M
labels: [db, backend]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-023, TICKET-172]
blocks: [TICKET-026, TICKET-027, TICKET-058, TICKET-061, TICKET-069, TICKET-173]
branch: TICKET-024
pr: ""
created: 2026-10-21
updated: 2026-11-04
started: 2026-11-04
completed: ""
reason: ""
resume_to: ""
---

# TICKET-024: Migrate admission counters and scan event tables

## Context

Check-ins are unique per guest today (no partial admission, no failed-scan log); menu categories, order statuses and staff roles differ from the PRD.

See: [Data model](../docs/prd.md#data-model) · [Gate check-in](../docs/prd.md#gate-check-in) (CHK-3, CHK-5) · [Table ordering](../docs/prd.md#table-ordering) (ORD-2, ORD-5) · [Users and roles](../docs/prd.md#users-and-roles).

## Scope

- Migrate admission counters and immutable scan-event records, referencing TICKET-172 staff/devices. Menu/orders are TICKET-171; staff identities are TICKET-172.

## Out of scope

- Settings and audit tables (TICKET-025).

## Acceptance criteria

- [ ] Admission counters and all five scan results have constrained schemas, indexes and staff/device references.
- [ ] A unique client event id supports retry without duplicate rows; unknown-token attempts allow a null invitation reference.
- [ ] Migrate both an empty database and bootstrap schema in disposable tests; retain existing data and prove invalid counts/results are rejected.

## Test plan

- Integration: disposable migration/seed, constraints, unique event ids and foreign keys.
- Manual: review generated SQL and consumer contracts with TICKET-058 and TICKET-173.

## Files likely touched

- `src/modules/shared/server/db/schema.ts`
- `drizzle/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-03 — todo → claimed — divine (codex)
- 2026-11-04 — todo → in_progress — divine (codex)
- 2026-11-04 — in_progress → blocked — divine (codex) — Isolated stack failed startup twice; migration generation must also wait for PR84's reserved 0011 migration to reach develop. Draft schema and tests are preserved for review.
- 2026-11-04 — blocked → in_progress — divine (codex) — Isolated stack recovered after parking the verified owned TICKET-031 stack. Existing migrations apply; three storage tests now fail for the missing tables. Continue schema/guard work while awaiting PR84 migration integration.
