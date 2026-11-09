# Ticket

Ticket: TICKET-084

# Summary

Every guest order now queues an alert for the kitchen and bar leads (PRD ORD-9) without ever slowing down or refusing
the order.

- **Queued with the order:** each order writes one alert row per station ticket inside the order's own transaction. A
  committed order always has its alert, and a rolled-back order never does.
- **Drained by the database:** a drain runs every 10 seconds, scheduled by the database (`pg_cron` + `pg_net`). It sends
  each station's batch once its oldest alert has waited 50 seconds, so no alert waits longer than 60 seconds, even when
  no more orders arrive.
- **Failures:** a failed send is retried on later ticks and given up after 5 attempts. The order is never affected.

Until the WhatsApp provider lands (TICKET-085), batches go to a logging sender that records only the station and line
count.

# Changes

- **Migration `drizzle/0013_fresh_doctor_faustus.sql`:**
  - `order_alerts` with `order_alert_status` (`pending`, `sent`, `failed`)
  - a unique row per station ticket
  - a pending-queue index and check constraints
  - RLS enabled with no policies, like every other table
- **`src/modules/shared/server/db/schema.ts`:** the table and enum.
- **`src/modules/ordering/server/create-order.ts`:** inserts the formatted alerts after the station tickets, in the same
  transaction.
- **`src/modules/ordering/server/alert-outbox.ts`:** `drainOrderAlerts`, which runs one transaction per drain. It locks
  pending rows with `FOR UPDATE SKIP LOCKED`, sends the due batches, marks them sent or failed, and commits. A crash
  rolls back to pending.
- **`src/app/api/alerts/drain/route.ts` and `server/alert-drain-request.ts`:** `POST /api/alerts/drain`. It needs
  `Authorization: Bearer $ALERT_DRAIN_SECRET`, compared in constant time; without the secret configured it answers 503.
- **`server/alert-drain.ts`:** `loggingSender`, which logs counts only, never the message.
- **`scripts/alerts-schedule.ts` (`pnpm alerts:schedule --url … | --remove`):**
  - creates the `pg_cron` and `pg_net` extensions if they're missing
  - upserts the `order-alerts-drain` job every 10 seconds
  - quotes values with Postgres `format(%L)`
  - never prints the secret
- **Env:** `ALERT_DRAIN_SECRET` (64 lowercase hex characters), in the env schema and `.env.example`.
- **ADR 0022:** now Accepted, and updated with the transaction drain, the ops-step scheduling and the evidence.
- **Tests:**
  - `scripts/__tests__/order-alerts.integration.test.ts` (5)
  - `scripts/__tests__/alerts-schedule.test.ts`
  - `src/modules/ordering/__tests__/alert-drain-auth.test.ts`
  - the env test updated

# Acceptance criteria and evidence

- [x] **Three orders in 60 seconds give one batched message per station.**
  - Unit test with a fake clock: `alerts.test.ts`.
  - Against Postgres: three orders, then a drain at once sends nothing for them. A drain 51 seconds later sends exactly
    one kitchen and one bar message, each with three lines.
- [x] **An alert failure never blocks order creation.** With a failing sender:
  - the drain reports failures
  - the alerts stay `pending` with `attempts = 1`
  - the order is still there and a new order is created
  - after 5 ticks both alerts are `failed`
- [x] **ADR merged.** ADR 0022 is Accepted in this PR.
- [x] **A durable scheduled drain sends the last batch within 60 seconds with no new requests.**
  - Integration test: one order, then no traffic. A drain at +60 seconds sends it, and a drain at +70 seconds sends
    nothing more.
  - Overlapping drains send each alert once.
  - Local end to end: `pnpm alerts:schedule` against the local Supabase stack, then one order through
    `POST /api/orders`, then no traffic. `pg_cron` posted to the drain, and the alert was marked sent **57 seconds**
    after the order.

# Verification

- `pnpm db:migrate` run twice with `pnpm db:counts` diffed: identical, 14 migrations applied and `order_alerts` empty.
- `pnpm db:check-rls`: RLS on all 17 public tables.
- `RUN_ORDER_ALERT_DB_TESTS=1 RUN_ORDER_SUBMIT_DB_TESTS=1 RUN_ORDERING_DB_TESTS=1 vitest run --no-file-parallelism` on
  the alert, create-order and ordering suites: 34 passed.
- Unit tests for ordering, env and the schedule arguments: passed.
- `pnpm typecheck` and ESLint: clean. Full `pnpm verify` is run by `pnpm t:pr`; see CI.
- Drain route by hand: no token → 401; with the secret → `{"sent":0,"failed":0,"waiting":0}`.
- **Not verified:** the schedule on the production database host. It waits on TICKET-213.

# Risks and rollout

- **Migration:** additive only: a new enum, table, foreign key and indexes. Approved by the owner on 2026-11-06.
  **Rollback:** run `pnpm alerts:schedule --remove`, revert this PR, and drop `order_alerts` and `order_alert_status`
  in a follow-up generated migration. Orders don't depend on the table being drained.
- **Production setup:** set `ALERT_DRAIN_SECRET` in the deployment, then run
  `pnpm alerts:schedule --url https://<site>/api/alerts/drain` against the production database. This needs
  `pg_cron` and `pg_net`: available on Supabase. On Neon `pg_net` isn't available, so another HTTP path is needed.
- **The secret sits in `cron.job`:** it's in the job command, readable by database administrators only. Rotate it by
  re-running the command.
- **At-least-once delivery:** if the database fails right after a successful send, that batch is sent again.
- **No provider yet:** until TICKET-085, due batches are marked sent after being logged.

# Screenshots

N/A: no UI.

# UI checklist

N/A: no UI changes.

# Harness changes, if any

None.
