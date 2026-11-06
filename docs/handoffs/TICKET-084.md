# TICKET-084 handoff

- **2026-11-04 (unclechenna, claude):** partial and blocked. The pure alert logic and ADR 0022 (Proposed) were on the
  branch, waiting on migration approval and the production database host.
- **2026-11-06 (unclechenna, claude):** built after the owner approved the migration.
  - **Outbox:** `order_alerts`, written in `createOrder`'s transaction with one row per station ticket.
  - **Drain:** `drainOrderAlerts` in `server/alert-outbox.ts`, behind `POST /api/alerts/drain` (Bearer
    `ALERT_DRAIN_SECRET`; 503 without one).
  - **Schedule:** `pnpm alerts:schedule --url <origin>/api/alerts/drain` sets up `pg_cron` every 10 seconds with
    `pg_net`; `--remove` takes it off. Locally, use `http://host.docker.internal:<devPort>/api/alerts/drain`.
  - **Tests:** `RUN_ORDER_ALERT_DB_TESTS=1 pnpm exec vitest run --no-file-parallelism scripts/__tests__/order-alerts.integration.test.ts`.
    Run DB suites serially: the order suites toggle "ordering open" and interfere when run in parallel.
  - **Next:**
    - TICKET-085: the WhatsApp sender, replacing `loggingSender` in `alert-drain-request.ts`.
    - TICKET-143: the alert health page, which reads `status = 'failed'`.
    - The production schedule, once TICKET-213 picks the host.
