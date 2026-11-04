# Ticket

Ticket: TICKET-084

# Summary

**Draft: partial, blocked on two owner decisions.** Orders should alert the kitchen or bar lead, batched per station
when busy, without ever blocking an order. This PR has:

- the proposed design (ADR 0022)
- the tested logic for the message format, batching, drain, retry and give-up

It doesn't yet have the outbox table, its wiring into orders, or the scheduler. Those need a migration approval and a
decision on the production database host.

# Changes

- `docs/decisions/0022-order-alert-outbox.md` (Proposed):
  - an outbox row per station ticket, written in the order's transaction
  - a 50-second batch window and a database-scheduled drain every 10 seconds, so no alert waits more than 60 seconds
  - `SKIP LOCKED` claiming, retry, and give-up after 5 attempts
  - the rejected alternatives
- `src/modules/ordering/lib/alerts.ts`: `formatOrderAlert` (the PRD's "Table 12: 2 x chicken, 1 x water. Note: no
  pepper."), `dueBatches` and the timing constants.
- `src/modules/ordering/server/alert-drain.ts`: `drainAlerts`, the `AlertOutbox` interface, `dryRunSender` and
  `memoryAlertOutbox`.
- `src/modules/ordering/__tests__/alerts.test.ts`: 10 fake-clock tests.

# Acceptance criteria and evidence

- [x] **Three orders in 60 seconds give one batched message per station (unit with a fake clock).** Orders at 0, 20 and
      40 seconds, each with food and a drink, and a drain every 10 seconds with no new traffic, produce exactly one kitchen
      message and one bar message.
- [ ] **An alert failure never blocks order creation.**
  - Done: the drain isolates failures. A failed batch is retried on the next tick, given up after 5 attempts, and never
    blocks the other station.
  - Remaining: alerts aren't enqueued from `createOrder` yet, so there's no order-level test.
- [ ] **ADR merged.** ADR 0022 is Proposed and needs the owner's decision on the scheduler host.
- [ ] **A durable scheduled drain sends the last batch within 60 seconds.** The timing is designed and unit-tested; the
      schedule, the drain route and the integration test remain.

# Verification

- `vitest run src/modules/ordering/__tests__/alerts.test.ts`: 10 passed.
- `pnpm typecheck` and ESLint: clean.
- Not run: integration tests (no table yet).

# Risks and rollout

- No schema, migration, dependency, CI or RLS changes in this PR. Nothing calls the new code yet, so merging it changes
  no behaviour.
- **Needed from the owner:**
  1. Exact-path approval for the `order_alerts` migration.
  2. The production database host, Supabase or Neon, which picks the scheduler.

# Screenshots

N/A: no UI.

# UI checklist

N/A: no UI changes.

# Harness changes, if any

None.
