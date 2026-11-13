---
id: TICKET-072
title: Submit orders with quantities, note and honest retrying
epic: ordering
status: done
priority: high
estimate: L
labels: [frontend, backend]
module: ordering
owner: unclechenna
agent: claude
blocked_by: [TICKET-071]
blocks: [TICKET-074, TICKET-080, TICKET-097, TICKET-116, TICKET-123]
branch: TICKET-072
pr: https://github.com/UncleChenna/wedding-app/pull/86
created: 2026-10-21
updated: 2026-11-04
started: 2026-11-03
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

- [x] A submit retried three times creates one order (unit + e2e with flaky network).
- [x] The UI shows sending, sent and failed states; failed offers retry.
- [x] The note is limited and stored as plain text.

- [x] Validate table, current availability, item caps, quantities and note bounds transactionally. Bind an idempotency key to submission payload/table; replay cannot create duplicate orders and a mismatched replay fails.

## Test plan

- Unit: Idempotent create.
- End-to-end: Flaky network via route interception.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Integration: simultaneous sold-out/cap changes, duplicate taps, same key/different body and database rollback.

## Files likely touched

- `src/modules/ordering/`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-04:
  - **Idempotency without a migration.** The existing unique `orders.client_request_id` is the key. A replay is
    compared with the stored table, note and items (order-independent): identical returns the original order, anything
    else is a 409 `mismatch`.
  - **Station rows on write.** The TICKET-171 schema only stores an item under a `station_orders` row, so every order
    writes one per station used. TICKET-074 keeps its acceptance tests and the grouped guest confirmation.
  - **Retry policy.** Network errors, 10s timeouts, 408/429 and 5xx retry after 1s, 2s and 4s with the same id;
    rejections never retry. "Try again" reuses the id; editing a failed order starts a new one.
  - **Plain-text note.** Control and format characters become spaces, whitespace collapses, 140 characters max, and it
    renders as text (`<b>` shows literally in the browser test).
  - **No open/close gate yet.** Any confirmed table can order until TICKET-080. Limits are TICKET-073.
  - **Not verified.** Lighthouse 95/93/93 under load average about 23; page weight 412 KB against the PRD's 200 KB, a
    pre-existing cost of fonts and framework JS (`docs/reviews/TICKET-072/performance.json`). Real phones and WhatsApp
    remain TICKET-138/201.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-03 — todo → claimed — unclechenna (claude)
- 2026-11-03 — todo → in_progress — unclechenna (claude)
- 2026-11-04 — in_progress → in_review — unclechenna (claude)
