---
id: TICKET-084
title: Queue order alerts in an outbox and batch them per station
epic: alerts
status: in_progress
priority: high
estimate: M
labels: [backend, db]
module: ordering
owner: unclechenna
agent: claude
blocked_by: [TICKET-171, TICKET-074]
blocks: [TICKET-085, TICKET-086, TICKET-112, TICKET-143]
branch: TICKET-084
pr: ""
created: 2026-10-21
updated: 2026-11-06
started: 2026-11-04
completed: ""
reason: ""
resume_to: ""
---

# TICKET-084: Queue order alerts in an outbox and batch them per station

## Context

Every new order queues an alert; when busy, alerts batch per station every 60 seconds. The board stays the source of truth.

See: [ORD-9 WhatsApp order alerts](../docs/prd.md#ord-9--whatsapp-order-alerts-must).

## Scope

- ADR: outbox table drained by Supabase pg_cron (Vercel Hobby cron is daily only) or request-time flush.
- Batching rule from assumption 7; dry-run provider for dev/test.
- Message format "Table 12: 2 x chicken, 1 x water. Note: no pepper."

## Out of scope

- Provider (TICKET-085).

## Acceptance criteria

- [x] Three orders in 60s produce one batched message per station (unit with fake clock).
- [x] An alert failure never blocks order creation (test).
- [x] ADR merged.

- [x] A durable scheduled drain sends the final pending batch within the approved 60-second window even if no new request arrives; request-triggered flushing alone is insufficient.

## Test plan

- Unit: Batching and formatting.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Integration: enqueue one order then stop traffic; advance scheduled time and verify one bounded batch with retry/idempotency behavior.

## Files likely touched

- `src/modules/ordering/server/alerts.ts`
- `docs/decisions/`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-04:
  - **Done:** ADR 0022 (Proposed); `lib/alerts.ts` (PRD message format, 50-second batch window plus 10-second drain,
    so no alert waits over 60 seconds); `server/alert-drain.ts` (`drainAlerts`, `AlertOutbox` interface, dry-run
    sender, an in-memory outbox with claim/retry/give-up semantics). 10 fake-clock unit tests pass, including three
    orders in a window giving one message per station.
  - **Blocked on the owner:**
    1. **Migration approval** for the `order_alerts` table: exact-path entries in `.harness/approved-writes.json` for
       the generated `drizzle/0012_*.sql`, its snapshot and `_journal.json` (0011 is TICKET-031's).
    2. **Production database host** (Supabase as TICKET-144 plans, or Neon): it decides the scheduler (`pg_cron` +
       `pg_net` on Supabase; `pg_cron` on Neon only if the compute stays awake and outbound HTTP works).
  - **Remaining after approval:** the schema and migration, enqueue in `createOrder`'s transaction, a Postgres
    `SKIP LOCKED` outbox, a secret-protected `POST /api/alerts/drain`, the schedule, and integration tests (stop
    traffic, advance time, one bounded batch, retry and idempotency).
- 2026-11-06 (unclechenna, claude): the owner approved the migration and building now on the local Supabase stack.
  - **Built:**
    - `order_alerts` (`drizzle/0013_fresh_doctor_faustus.sql`)
    - enqueue in `createOrder`'s transaction, one row per station ticket and unique per ticket
    - `server/alert-outbox.ts`: a one-transaction drain with `FOR UPDATE SKIP LOCKED`
    - `POST /api/alerts/drain`, using Bearer `ALERT_DRAIN_SECRET`
    - `pnpm alerts:schedule` (`pg_cron` + `pg_net`, every 10 seconds)
    - a logging sender until TICKET-085
  - **Evidence:**
    - 5 Postgres integration tests (`RUN_ORDER_ALERT_DB_TESTS=1`)
    - a local end-to-end run: one order, no further traffic, sent by `pg_cron` after 57 seconds
  - **Still open:** the production schedule. Run `pnpm alerts:schedule --url https://<site>/api/alerts/drain` once
    the host is chosen (TICKET-213). On Neon, `pg_net` isn't available, so the HTTP call needs another path.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-04 — todo → claimed — unclechenna (claude)
- 2026-11-04 — todo → in_progress — unclechenna (claude)
- 2026-11-04 — in_progress → blocked — unclechenna (claude) — Needs owner: exact-path approval for the order_alerts migration, and the production database host (Supabase or Neon) that decides the scheduler. Draft PR #91.
- 2026-11-06 — blocked → in_progress — unclechenna (claude)
