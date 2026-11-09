---
id: TICKET-182
title: Validate and commit guest CSV imports atomically
epic: admin
status: in_progress
priority: urgent
estimate: M
labels: [backend, test]
module: admin
owner: divine
agent: codex
blocked_by: [TICKET-090]
blocks: [TICKET-091]
branch: TICKET-182
pr: https://github.com/UncleChenna/wedding-app/pull/124
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-182: Validate and commit guest CSV imports atomically

## Context

Backlog audit coverage: INV-1, ADM-1. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Separate CSV parsing and transactional import from the preview UI.

## Out of scope

- Work outside the stated contract; consuming screens and launch operations remain in their linked tickets. The audit wording described the original backlog creation; this ticket now implements its authorized backend contract.

## Acceptance criteria

- [x] Validate headers, row bounds, contacts, grouping and per-invitation tag-along limits with row-specific errors; malformed CSV cannot partially write.
- [x] Document duplicate household/contact handling; repeated import uses a stable preview/commit identity and cannot create duplicate invitations.
- [x] Commit an approved preview atomically, reject changed/stale inputs, preserve existing RSVP state, and neutralize spreadsheet formulas in exported cells.

## Test plan

- Unit: quoted commas/newlines, Unicode, missing headers, duplicates and formula cells. Integration: failed middle row rolls back all writes; double submission and concurrent commit do not duplicate guests.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- src/modules/admin/lib/; src/modules/admin/server/

## Notes / decisions

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.

## Activity log

- 2026-10-21 — new → todo — divine
- 2026-11-09 — todo → claimed — divine (codex)
- 2026-11-09 — todo → in_progress — divine (codex)
- 2026-11-09 — Implemented create-only bounded CSV preview/commit, durable digest receipts and atomic retry protection. Parser/action/export tests: 18 passed; isolated database regressions: 5 passed; full unit suite: 1309 passed, 145 skipped. Repeat migrations and seeds preserve counts; all 23 public tables retain RLS. Independent read-only review found no blockers. See docs/guest-import.md and PR evidence for duplicate/expiry policy.
- 2026-11-09 — in_progress → in_review — divine (codex)
- 2026-11-09 — in_review → in_progress — divine (codex) — Review: recheck preview expiry after waiting for database locks

- 2026-11-09 — Review correction: recheck preview expiry after writer locks and conflict reads before insertion. Controlled-clock PostgreSQL regression reproduced the stale approval and verifies no inserted rows or receipt after correction. All six database tests pass. Retention follow-through explicitly maps to TICKET-127/TICKET-168.
