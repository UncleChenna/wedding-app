# TICKET-074 handoff

- **2026-11-04 (unclechenna, claude):** orders are explicitly split per station and the guest sees both parts.
  - `lib/stations.ts`: `STATIONS` (labels) and `splitByStation`, used by `createOrder` and the sent confirmation.
  - `MenuItem` now carries `station`.
  - Tests: `stations.test.ts`, the composer grouping test, two new database cases in
    `create-order.integration.test.ts`, and a grouping check in `e2e/order-submit.spec.ts` (screenshots now go to
    `docs/reviews/TICKET-074/`).
  - **Next:** TICKET-073 (limits inside `createOrder`), TICKET-084 (order alert outbox), and the boards
    (TICKET-076/077) reading `station_orders` by station, oldest first (`station_orders_queue_idx`).
  - **Local tip:** with many worktree databases running, Postgres connections time out. Removing merged worktrees
    (`pnpm wt:remove <id>`) fixed it here.
