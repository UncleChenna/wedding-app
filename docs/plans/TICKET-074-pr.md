# Ticket

Ticket: TICKET-074

# Summary

The kitchen and bar must each see only their part of an order. TICKET-072 already wrote one station row per station
because the schema requires it, but the split was implicit and untested, and the guest's confirmation was one flat
list.

The split is now one tested function, `splitByStation`, used both when writing the order and on the guest's
confirmation. The confirmation shows "From the kitchen" and "From the bar" groups.

# Changes

- `src/modules/ordering/lib/stations.ts`: station labels and `splitByStation`. Groups come in a fixed order (kitchen,
  then bar), each keeps its items' order, and a station with no items gets no ticket.
- `server/create-order.ts`: writes one `station_orders` ticket per group, all sharing the submission's `orders.id`.
- `lib/menu.ts` and `server/menu-repository.ts`: the guest menu item now includes `station`, so the confirmation can
  group by it.
- `components/order-composer.tsx`: the sent confirmation is grouped, with each list labelled by its heading.
- Tests and docs: `stations.test.ts`; composer tests; database cases in `create-order.integration.test.ts`; a browser
  check in `e2e/order-submit.spec.ts` (screenshots moved to `docs/reviews/TICKET-074/`); README, UI review, handoff and
  ticket notes.

# Acceptance criteria and evidence

- [x] **A mixed order creates one kitchen and one bar order sharing a submission id.**
  - Unit: `splitByStation` gives exactly two groups for a mixed submission.
  - Database: a mixed submission produces two `station_orders` rows, one per station, with the same `order_id`.
  - Browser: the stored order has 2 station rows, and the confirmation lists each item under its station.
- [x] **Single-station orders create one order.**
  - Unit: kitchen-only and bar-only submissions each give one group, and an empty one gives none.
  - Database: kitchen-only and bar-only submissions each create exactly one station row.

# Verification

- `vitest run src/modules/ordering`: 58 passed.
- `RUN_ORDER_SUBMIT_DB_TESTS=1 vitest run scripts/__tests__/create-order.integration.test.ts`: 12 passed. The first
  attempt timed out in setup while the machine was loaded, and a re-run passed.
- `RUN_ORDER_BROWSER_TESTS=1 playwright test e2e/order-submit.spec.ts --project=mobile`: 3 passed on a production
  build.
- `pnpm typecheck` and ESLint: clean. Full `pnpm verify`: run by `pnpm t:pr`; see CI.
- **Not verified:** Lighthouse (unchanged initial view; TICKET-072's record stands), and real phones and WhatsApp.

# Risks and rollout

- No schema, migration, dependency, CI or RLS changes.
- The guest menu payload now includes each item's station ("kitchen" or "bar"), which isn't sensitive.
- To roll back, revert this PR.

# Screenshots

`docs/reviews/TICKET-074/<theme>/<width>-sent.png` shows the grouped confirmation in all four themes at 375, 768 and
1280px.

# UI checklist

Recorded item by item in `docs/reviews/TICKET-074/REVIEW.md`.

- **Pass:** screenshots, tokens, typography, mobile, keyboard, contrast, copy (provisional), shared components.
- **N/A:** motion, QR, staff feedback, images.
- **Not verified:** performance (not re-measured), devices.

# Harness changes, if any

None.
