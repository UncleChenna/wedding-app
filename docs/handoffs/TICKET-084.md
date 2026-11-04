# TICKET-084 handoff

- **2026-11-04 (unclechenna, claude):** partial and blocked. The pure alert logic and ADR 0022 (Proposed) are on the
  branch, and the draft PR lists what's left.
  - `src/modules/ordering/lib/alerts.ts`: `formatOrderAlert`, `dueBatches` and the timing constants.
  - `src/modules/ordering/server/alert-drain.ts`: `drainAlerts`, `AlertOutbox`, `dryRunSender` and
    `memoryAlertOutbox`.
  - Tests: `src/modules/ordering/__tests__/alerts.test.ts` (10 passing).
  - **Waiting on the owner:** migration approval for `order_alerts`, and the production database host, which decides
    the scheduler. See the ticket notes for the exact list.
  - **To resume:** add `order_alerts` to the schema, `pnpm db:generate` (after approval), implement a Drizzle
    `AlertOutbox` with `FOR UPDATE SKIP LOCKED`, enqueue per station ticket inside `createOrder`, add the drain route
    with a shared secret, schedule it, and add the integration tests from the ticket's audit line.
