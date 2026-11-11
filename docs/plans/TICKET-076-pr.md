# Ticket

Ticket: TICKET-076

# Summary

Before this change, `/kitchen` showed "coming soon" after sign-in. It now shows the live kitchen board (PRD ORD-4):

- open orders by table, oldest first, with items, the guest's note, dietary notes for the table, and each order's
  age
- new orders arrive within 2 seconds over the private kitchen channel from TICKET-033
- each new order flashes with a "New" label, and chimes once someone taps "Turn on sound"
- the tablet stays awake where the browser allows it

# Changes

- **`src/modules/ordering/lib/station-board.ts`** (new):
  - the board contract: a strict kitchen ticket, plus a bar ticket with no dietary field for the bar board
  - `ticketAge` ("Just now", "4 min", "1 h 5 min")
  - `newTicketIds`
- **`src/modules/ordering/server/station-board.ts`** (new), `readKitchenBoard`:
  - open kitchen tickets (received or preparing), oldest first, with their items
  - dietary notes from guests seated at that table: their own table, or else their household's
- **`station-board-response.ts`**, **`kitchen-board.ts`** and `GET /api/kitchen/board` (new):
  - The live kitchen session is checked on every read: 403 without it.
  - The response is checked against the kitchen contract.
  - Errors return a plain 503, and responses are `private, no-store`.
- **`src/modules/ordering/components/kitchen-board.tsx`** (new, client): the board.
  - **Live updates:** `subscribeStation` refetches on each notice, rejoin and retry.
  - **New orders:** a 4-second opacity flash with a "New" label. It disappears without animation under reduced
    motion.
  - **Sound:** a Web Audio chime after "Turn on sound".
  - **Wake lock:** requested, and requested again when the tab becomes visible.
  - **Status:** a Live or Reconnecting line, in text as well as colour.
  - **Sign-out:** a signed-out notice when the device's access ends.
- **`kitchen-station.tsx`** (new) and **`src/app/(staff)/kitchen/page.tsx`:** signed out, the existing PIN sign-in;
  signed in, the board with server-rendered first data.
- **Tests:**
  - `src/modules/ordering/__tests__/station-board.test.ts`: 13 unit tests.
  - `e2e/kitchen-board.spec.ts`: opt-in with `RUN_KITCHEN_BOARD_E2E=1`.
- **Review screenshot:** `docs/reviews/TICKET-076/375-kitchen-board.png`.

# Acceptance criteria and evidence

- [x] **New orders appear oldest first within 2 s (e2e).**
  - Playwright on a production build against the local stack signs in with a real kitchen PIN and waits for "Live".
  - It then writes an order, together with its broadcast, in one transaction, the way `createOrder` does. The card
    appears in under 2,000 ms, measured from the write.
  - A second order appears below the first.
- [x] **A new order chimes when audio is unlocked, and flashes either way.**
  - The first order, before sound is on, shows "New" and starts no oscillator.
  - After "Turn on sound" ("Sound on" shows), the second order starts the chime: the test counts the
    `AudioContext.createOscillator` calls.
- [ ] **The board is legible at 1 metre on a tablet (manual).** Not done: it needs a person with a real tablet.
  - For reference: table numbers are 36 px (`text-4xl`) display type, items 20 px and other text 18 px.
  - **Please check** `/kitchen` on the kitchen tablet at arm's length.

# UI checklist (staff screen scope)

- **Screenshots:** PASS. One theme at 375 px: `docs/reviews/TICKET-076/375-kitchen-board.png`, inspected.
  - The table name is now body sans; it had inherited the display serif and wrapped.
  - The six-digit table numbers come from test fixtures. Real tables are 1 to 2 digits.
- **Tokens:** PASS. Only theme classes are used (`bg-warning-subtle`, `text-success-subtle-foreground`,
  `border-warning` and so on); there are no literal colours.
- **Restraint and typography:** PASS. One idea (orders waiting); identifiers at least 32 px; body at least 18 px.
- **Mobile:** PASS. No horizontal scroll at 375 px in any theme (asserted). Buttons use the shared `lg` size (52 px
  tall).
- **Motion:** PASS. The flash animates opacity only, for 300 ms, and is instant under reduced motion
  (`motion-reduce:transition-none`). Nothing blocks.
- **Keyboard:** PASS. "Turn on sound" and "Sign out" are native buttons with visible focus; there are no dialogs.
- **Contrast:** PASS. The axe scan in every registered theme at 375 px found no WCAG A or AA violations. "New", "Live"
  and "Dietary at this table" are text, not colour alone.
- **Load and images:** N/A. No images.
- **Performance:** N/A. Staff screen, not a guest page.
- **Copy:** PASS, provisional: "No orders waiting", "Turn on sound", "Reconnecting… checking for orders", and "This
  device was signed out. Reload the page and sign in with your PIN."
- **Shared components:** PASS. `Button` and `Card`; no new shared pattern.
- **Sharing and devices:** N/A. Staff screen.
- **QR codes:** N/A.
- **Staff feedback:** PASS for the board's feedback: a new order flashes immediately, chimes when sound is allowed,
  and shows the same flash when audio is unavailable or blocked.
- **Verification:** see below.

# Verification

- `RUN_KITCHEN_BOARD_E2E=1 playwright test e2e/kitchen-board.spec.ts --project=mobile` on `pnpm build`: 1 passed.
- `vitest run src/modules/ordering/__tests__/station-board.test.ts`: 13 passed.
- `pnpm typecheck` and ESLint: clean (also run by the commit hook's `verify:quick`).

# Not tested and limitations

- **Legibility on a real tablet** at 1 m (manual, above). The wake lock was also not tried on a real tablet.
- **The browser test's order write mirrors `createOrder`** (tables, order, station ticket, item and broadcast in one
  transaction) instead of calling it. Playwright can't import `server-only` modules. TICKET-033's integration tests
  cover `createOrder`'s publishing itself.
- **Status buttons** are TICKET-078.
- **The test needs a time zone:** staff sign-in needs an event date and time zone, and seeded data has no time
  zone. The test sets both for its run and restores them afterwards.

# Risks and rollout

- No migration. `/kitchen` behaves as before when signed out.
- **Rollback:** revert the PR.

# Screenshots

`docs/reviews/TICKET-076/375-kitchen-board.png`

# Harness changes, if any

None.
