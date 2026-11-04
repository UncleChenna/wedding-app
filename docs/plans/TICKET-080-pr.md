# Ticket

Ticket: TICKET-080

# Summary

The couple want ordering to open only after their entrance (PRD ORD-7). Before this change, any confirmed table could
order at any time.

Now guest ordering follows `event_settings.ordering_open`, which already defaulted to **closed**. While it's closed:

- the server refuses guest orders
- the order page shows "The menu opens soon" instead of the menu

A **Table ordering** switch on the admin control room opens and closes it. Open order pages follow within about 3
seconds, without a reload.

# Changes

- **`src/modules/ordering/server/create-order.ts`:** after the replay check, a guest order is refused with `closed`
  while ordering is off. `options.staffEntered` lets the staff-entered orders of TICKET-079 through.
- **`lib/order.ts`:** the new `closed` rejection and its copy.
- **`lib/menu.ts`, `server/menu.ts` and the availability route:** the poll payload now carries `open`.
- **`components/use-menu-availability.ts`:** tracks `open` from polls, announces changes, and adds `markClosed()`.
- **`components/order-composer.tsx`:** the closed view, keeping the guest's choices.
- **`order-menu.tsx` and `order-entry.tsx`:** pass in the initial state from settings.
- **Admin:**
  - `src/modules/admin/server/ordering-switch.ts`: a Server Action that checks admin access itself
  - `components/ordering-switch.tsx` and `lib/ordering-switch.ts`: the switch and its copy
  - it sits on the control room dashboard
- **Tests:**
  - `e2e/support/ordering-open.ts`: lets the existing ordering tests open ordering and restore it
  - new `e2e/ordering-closed.spec.ts`
  - new cases in `create-order.integration.test.ts`, `order-composer.test.tsx`, `admin-dashboard.test.tsx` and
    `e2e/admin-menu.spec.ts`

# Acceptance criteria and evidence

- [x] **While closed, guest orders are refused server-side, and the page says so.**
  - Database: a guest order while closed returns `closed` and writes nothing. A staff-entered order is accepted. A
    retry of an order sent before closing still returns that order.
  - Browser: the closed page shows "The menu opens soon" with no Send button. A direct `POST /api/orders` returns 422
    `{ status: "rejected", reason: "closed" }`.
- [x] **Toggling takes effect within 5 seconds.**
  - Browser: opening shows the menu and Send button in under 5 seconds, and closing shows the closed message in under
    5 seconds (both timed).
  - Signed-in admin test: "Close ordering" and then "Open ordering" update the setting.
  - Component tests: switching driven by polls, with announcements.

# Verification

- `vitest run src/modules/ordering src/modules/admin`: all passed (63 ordering, 55 admin).
- `RUN_ORDER_SUBMIT_DB_TESTS=1 vitest run scripts/__tests__/create-order.integration.test.ts`: 21 passed.
- `playwright test e2e/ordering-closed.spec.ts e2e/order-submit.spec.ts e2e/menu-availability.spec.ts
e2e/admin-menu.spec.ts e2e/access-matrix.spec.ts --project=mobile`: 10 passed on a production build. Run with the
  ordering, menu and admin opt-in flags, a fresh admin address, and this worktree's local Auth.
- `pnpm typecheck`, ESLint and Prettier: clean. Full `pnpm verify`: run by `pnpm t:pr`; see CI.

# Risks and rollout

- **After merge, ordering is closed until an admin opens it**, because the column default is `false`. That's
  intended for the event; open it from the control room when testing.
- No schema, migration, dependency, CI or RLS changes.
- To roll back, revert this PR.

# Screenshots

`docs/reviews/TICKET-080/<theme>/<width>-closed.png` covers all four themes at 375, 768 and 1280px.

# UI checklist

Recorded item by item in `docs/reviews/TICKET-080/REVIEW.md`.

- **Pass:** screenshots, tokens, typography, mobile, keyboard, contrast, load, copy, shared components, staff
  feedback.
- **N/A:** motion, QR.
- **Not verified:** performance, devices.

# Harness changes, if any

None.
