# TICKET-073 handoff

- **2026-11-04 (unclechenna, claude):** table limits are enforced in `createOrder`'s transaction.
  - Table row `FOR UPDATE`, replay re-check after the lock, cooldown (database clock, `retryAfterSeconds`), open-order
    cap (received/preparing/ready), and per-item cap `min(max_per_order, max_item_quantity)`. Limits come from
    `event_settings` via `getEventSettings(tx)`.
  - New rejection reasons `cooldown` and `too-many-open`; `cooldownMessage(seconds)` for the guest.
  - Tests use a fresh table each (`beforeEach`) in `create-order.integration.test.ts` and `e2e/order-submit.spec.ts`,
    so one test's order never trips the next test's cooldown.
  - **Owner decision:** cooldown default is 30s in the schema but 60s in the ticket and current-state. Not changed here.
  - **Next:** TICKET-084 (alert outbox); TICKET-078 (staff status changes) frees slots by marking orders served.
