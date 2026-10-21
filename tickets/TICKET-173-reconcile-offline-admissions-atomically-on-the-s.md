---
id: TICKET-173
title: Reconcile offline admissions atomically on the server
epic: checkin
status: todo
priority: high
estimate: L
labels: [backend, db, test]
module: checkin
owner: ""
agent: ""
blocked_by: [TICKET-024, TICKET-031, TICKET-058]
blocks: [TICKET-066]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-173: Reconcile offline admissions atomically on the server

## Context

Backlog audit coverage: CHK-5–7. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Implement the server half of offline reconciliation separately from the device queue.

## Out of scope

- Work outside the stated contract; consuming screens and launch operations remain in their linked tickets. No product implementation is part of this audit.

## Acceptance criteria

- [ ] Authorize staff/device event batches and merge them transactionally using a unique client event id; identical retry is a no-op and same id with different payload is rejected.
- [ ] Persist every attempted scan and its reported time/result while keeping canonical admissions bounded by the invitation allowance.
- [ ] When two offline devices each report four admissions for a party of four, retain all eight reported admissions as evidence, count only four canonical admissions, and flag the conflict for TICKET-067.
- [ ] Concurrent requests and partial failures never lose events or acknowledge an uncommitted write; return per-event acknowledgements and conflicts.

## Test plan

- Integration: real database concurrent merges, duplicate and conflicting payloads, permission/expiry rejection and transaction rollback. End-to-end: replay the same batch twice and reconcile two disconnected devices.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- src/modules/checkin/server/; src/modules/checkin/__tests__/

## Notes / decisions

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.

## Activity log

- 2026-10-21 — new → todo — divine
