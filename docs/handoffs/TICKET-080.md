# TICKET-080 handoff

- **2026-11-04 (unclechenna, claude):** guest ordering follows the admin's Table ordering switch.
  - It's closed by default. Open it from the control room (or set `event_settings.ordering_open`) before testing
    orders by hand. Opt-in ordering tests do this themselves through `e2e/support/ordering-open.ts`.
  - Staff-entered orders (TICKET-079) should call `createOrder(db, order, { staffEntered: true })`.
  - Remember to seed a fresh worktree (`pnpm db:seed`); `wt:new` doesn't.
