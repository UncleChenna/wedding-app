---
id: TICKET-024
title: Migrate admission counters and scan event tables
epic: data-auth
status: in_review
priority: urgent
estimate: M
labels: [db, backend]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-023, TICKET-172]
blocks: [TICKET-026, TICKET-027, TICKET-058, TICKET-061, TICKET-069, TICKET-173]
branch: TICKET-024
pr: https://github.com/UncleChenna/wedding-app/pull/85
created: 2026-10-21
updated: 2026-11-08
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

- [x] Admission counters and all five scan results have constrained schemas, indexes and staff/device references.
- [x] A unique client event id supports retry without duplicate rows; unknown-token attempts allow a null invitation reference.
- [x] Migrate both an empty database and bootstrap schema in disposable tests; retain existing data and prove invalid counts/results are rejected.

## Test plan

- Integration: disposable migration/seed, constraints, unique event ids and foreign keys.
- Manual: review generated SQL and consumer contracts with TICKET-058 and TICKET-173.

## Files likely touched

- `src/modules/shared/server/db/schema.ts`
- `drizzle/`

## Notes / decisions

- 2026-11-04 — Draft PR85 includes additive schema and proposed preservation/guard SQL. Four guard tests passed; latest run passed three cases including both populated preservation cases, with three connection timeouts. Quick verification passes lint, types and 45 tests (38 opt-in skips). Final migrations and concurrency verification remain outstanding; no acceptance criteria completed.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-03 — todo → claimed — divine (codex)
- 2026-11-04 — todo → in_progress — divine (codex)
- 2026-11-04 — in_progress → blocked — divine (codex) — Isolated stack failed startup twice; migration generation must also wait for PR84's reserved 0011 migration to reach develop. Draft schema and tests are preserved for review.
- 2026-11-04 — blocked → in_progress — divine (codex) — Isolated stack recovered after parking the verified owned TICKET-031 stack. Existing migrations apply; three storage tests now fail for the missing tables. Continue schema/guard work while awaiting PR84 migration integration.
- 2026-11-04 — in_progress → blocked — divine (codex) — Awaiting exact-path authorization for unchanged develop migration 0011 files and approval record. Prepared merge and nine passing proposal tests are preserved in this worktree; PR85 remains draft.
- 2026-11-08 — blocked → in_progress — divine (codex) — User approved unchanged develop migration0011 files and authorization record; finish preserved base integration.
- 2026-11-08 — in_progress → blocked — divine (codex) — Approved historical integration pushed in3d76afb2; awaiting current develop2706b96 base-update authorization per docs/reviews/TICKET-024/base-update-proposal.md to avoid migration0012–0015 collisions.
- 2026-11-08 — blocked → in_progress — divine (codex) — User approved current develop2706b96 base update, listed unchanged files and authorization record.
- 2026-11-08 — in_progress → blocked — divine (codex) — Automatic approval review rejected new migration generation; awaiting exact0016/0017/0018 SQL, snapshots and journal generation/testing/commit authorization in docs/reviews/TICKET-024/migration-approval.md. Approved base update is complete.
- 2026-11-08 — blocked → in_progress — divine (codex) — User approved exact0016–0018 generation, isolated testing, commit and authorization record.
- 2026-11-08 — in_progress → in_review — divine (codex)
