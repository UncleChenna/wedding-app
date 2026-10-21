---
id: TICKET-072
title: Submit orders with quantities, note and honest retrying
epic: ordering
status: todo
priority: high
estimate: L
labels: [frontend, backend]
module: ordering
owner: ""
agent: ""
blocked_by: [TICKET-071]
blocks: [TICKET-074, TICKET-080, TICKET-097, TICKET-116, TICKET-123]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-072: Submit orders with quantities, note and honest retrying

## Context

Guests pick items, quantities and a short note; on bad Wi-Fi the page retries automatically and shows "sending…" honestly.

See: [Table ordering](../docs/prd.md#table-ordering) (ORD-3) · [Connectivity plan](../docs/prd.md#connectivity-plan-signal-unknown) · [On the website](../docs/prd.md#on-the-website).

## Scope

- Cart with QuantityStepper and a 140-character note.
- Idempotency key per submission; automatic retry with backoff; visible sending state.
- "On its way. Sit back, we've got this."

## Out of scope

- Limits (TICKET-073), routing (TICKET-074).

## Acceptance criteria

- [ ] A submit retried three times creates one order (unit + e2e with flaky network).
- [ ] The UI shows sending, sent and failed states; failed offers retry.
- [ ] The note is limited and stored as plain text.

- [ ] Validate table, current availability, item caps, quantities and note bounds transactionally. Bind an idempotency key to submission payload/table; replay cannot create duplicate orders and a mismatched replay fails.

## Test plan

- Unit: Idempotent create.
- End-to-end: Flaky network via route interception.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Integration: simultaneous sold-out/cap changes, duplicate taps, same key/different body and database rollback.

## Files likely touched

- `src/modules/ordering/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
