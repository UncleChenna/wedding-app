# Ticket

Ticket: TICKET-073

# Summary

Any table could send unlimited orders back to back. Now each order is checked, inside its database transaction, against
three limits read from event settings:

- a cooldown since the table's last order
- a cap on orders still in progress for that table
- a per-item cap

Concurrent orders from one table can't slip past, because they queue on the table's row lock on every server instance.
The guest sees how many seconds to wait, or that their table already has orders on the way, and their choice is kept
so they can send again.

# Changes

- **`server/create-order.ts`:**
  - locks the table row `FOR UPDATE` and runs the replay check again after the lock, so a waiting duplicate tap is
    answered as a replay, not charged twice
  - checks the cooldown using the database clock (`clock_timestamp()`) and returns `retryAfterSeconds`
  - counts open orders: received, preparing and ready
  - caps each item at the smaller of `max_per_order` and the event-wide `max_item_quantity`
- **`lib/order.ts`:** new `cooldown` and `too-many-open` rejections, `retryAfterSeconds` in the response schema, guest
  copy and `cooldownMessage(seconds)`.
- **`components/order-composer.tsx`:** shows the cooldown wait in seconds and keeps the order.
- **Tests:** limit cases in `create-order.integration.test.ts`; a cooldown browser test; composer tests. Both
  database-backed suites now use a fresh table per test so their orders don't trip each other's cooldown.
- **Docs:** module README, UI review, handoff and ticket notes.

# Acceptance criteria and evidence

- [x] **The 4th open order for a table is refused with defaults.** Database test: with three earlier open orders and
      default settings, the next submission is refused as `too-many-open` and writes nothing. A served and a cancelled order
      don't count.
- [x] **A second order within 60 seconds is refused and states the seconds left.**
  - Database test, with the cooldown set to 60 in a rolled-back transaction: the second order is refused with 55–60
    seconds left.
  - Browser test, at the default: the message reads "You can send this one in N seconds" and the guest's choice is kept.
- [x] **Concurrent submits can't exceed the limits.** Database test: 8 parallel submissions from one table create
      exactly 1 order, and 7 are refused by the cooldown. The existing parallel duplicate-tap test still gives 1 created and
      5 replayed.
- [x] **A mixed submission counts once, across instances.**
  - Database test: two earlier orders plus one mixed kitchen and bar submission makes 3 orders, and the next is refused
    at the limit of 3.
  - The row lock lives in Postgres, so it holds across server instances.

# Verification

- `vitest run src/modules/ordering`: 60 passed.
- `RUN_ORDER_SUBMIT_DB_TESTS=1 vitest run scripts/__tests__/create-order.integration.test.ts`: 18 passed.
- `RUN_ORDER_BROWSER_TESTS=1 playwright test e2e/order-submit.spec.ts --project=mobile`: 4 passed on a production build.
- `pnpm typecheck`, ESLint and Prettier: clean. Full `pnpm verify`: run by `pnpm t:pr`; see CI.
- **Not verified:** performance (not re-measured; only text after sending changed), and real phones and WhatsApp.

# Risks and rollout

- No schema, migration, dependency, CI or RLS changes.
- **Decision for the owner: the cooldown default.** The schema defaults it to **30 seconds**, but the ticket and
  current-state assumption 9 say **60**. The code reads whatever is set. Change it in event settings (TICKET-101), or
  approve a migration to change the default.
- Orders only leave the open count when staff mark them served or cancelled (TICKET-078). Until then, a table reaches
  its 3-order limit and stays there.
- To roll back, revert this PR.

# Screenshots

`docs/reviews/TICKET-073/<theme>/<width>-cooldown.png` covers all four themes at 375, 768 and 1280px.

# UI checklist

Recorded item by item in `docs/reviews/TICKET-073/REVIEW.md`.

- **Pass:** screenshots, tokens, typography, mobile, keyboard, contrast, copy (provisional), shared components.
- **N/A:** motion, load, QR, staff feedback.
- **Not verified:** performance, devices.

# Harness changes, if any

None.
