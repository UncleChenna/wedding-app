# Ticket

Ticket: TICKET-078

# Summary

Kitchen and bar staff can now move each order through the board (PRD ORD-5) with large buttons: Start preparing,
Served, or Cancel.

- **Moves:** each move shows immediately and is saved on the server, which accepts only legal moves. If the save
  fails, the card goes back and the board says so.
- **Cancelling** asks for confirmation and a reason.
- **Finished orders** collapse into a "Recently done" list.
- **History:** every move is timestamped, with who made it and on which device.

**Stacked:** #140 (TICKET-076), then #155 (TICKET-077), then this. Merge in that order.

# Changes

- **Migration `drizzle/0030_station-order-events.sql`** (generated, additive). A new `station_order_events` table
  holds:
  - the station ticket, from and to status, reason, staff, device and time
  - RLS on, with no browser policy (ADR 0024)
  - checks that a cancel has a reason and that from differs from to
- **`src/modules/ordering/lib/ticket-status.ts`** (new):
  - `canMove`, the move rules
  - `ticketMoveSchema`, a strict input check that requires a reason (at most 200 characters) to cancel
  - `orderStatusFrom`, which works out the guest order's status from its tickets
- **`server/move-ticket.ts`** (new): one transaction.
  1. Lock the ticket, on this station only; another station's ticket is `not_found`.
  2. Refuse a move from an out-of-date status (`stale`) or an illegal move.
  3. Record the event and update the ticket.
  4. Recompute the order's status, so the table's open-order limit frees up on serve.
  5. Notify the station, after commit.
- **`server/move-ticket-response.ts`**, **`move-ticket-route.ts`**, and `POST /api/{kitchen,bar}/tickets`:
  - each move rechecks the live station session
  - error statuses: 400, 403, 404, 409 (stale or illegal) and 503
  - plain messages, with no technical detail
- **Board data:** `recent` lists served or cancelled tickets from the last hour, newest first, at most 10.
- **`components/station-board.tsx`:** per-card buttons whose accessible names include the table.
  - Updates apply at once, with rollback and an alert on failure.
  - The cancel bottom sheet uses the shared `Sheet` and `Textarea`, with a required reason.
  - "Waiting" and "Preparing" status text, and a collapsible "Recently done" list.
- **Tests:** `ticket-status` and `move-ticket-response` unit tests, `scripts/__tests__/move-ticket.integration.test.ts`,
  and a third case in `e2e/station-boards.spec.ts`.

# Acceptance criteria and evidence

- [x] **The server accepts only legal moves (unit).**
  - The unit test checks every from/to pair against the move list, and that served and cancelled are final.
  - The database test refuses served → anything, with no event written and the order unchanged.
  - Of two racing moves on one ticket, exactly one wins and the other is `stale`.
  - The kitchen can't move the bar's ticket (`not_found`).
- [x] **A failed update reverts the card and shows an error (e2e with forced failure).**
  - Playwright makes the next save fail with a 503. The card returns to "Waiting" and the alert "Table N didn't
    update. Check the connection and try again." appears.
- [x] **Every move is timestamped.**
  - The database test reads back each event: from and to status, staff and device ids, and a valid `created_at`.
  - The e2e reads the three moves it made: preparing, served, and cancelled with "Guest left early".
  - The database refuses a cancel event without a reason (`23514`).

# UI checklist (staff screen scope)

- **Screenshots:** PASS. `docs/reviews/TICKET-078/375-board-actions.png` and `375-cancel-sheet.png`, inspected.
- **Tokens:** PASS. Shared `Button` variants and `bg-danger-subtle`; no literal colours.
- **Restraint and typography:** PASS. One primary action per card (Served); body text at least 18 px.
- **Mobile:** PASS. Buttons are 52 px tall. The cancel sheet is a bottom sheet.
- **Motion:** PASS. No new animation; the sheet uses the shared component.
- **Keyboard:** PASS. Native buttons. The reason field is labelled and its error is announced. The shared dialog
  handles focus, Escape and returning focus.
- **Contrast:** PASS. The axe scan in every theme at 375 px, with the cancel sheet open, found no WCAG A or AA
  violations. Status and errors are text.
- **Load and images:** N/A. No images.
- **Performance:** N/A. Staff screen.
- **Copy:** PASS, provisional: "Start preparing", "Served", "Cancel", "Cancel table N's order?", "Say why, so the
  guests can be told.", "Keep order", "Recently done", and "Someone else updated this order. The board is
  refreshing."
- **Shared components:** PASS. `Button`, `Card`, `Sheet` and `Textarea`; no new shared pattern.
- **Sharing and devices:** N/A. Staff screen.
- **QR codes:** N/A.
- **Staff feedback:** PASS. Every tap updates the card immediately, and a failed save shows an error and reverts.
- **Verification:** see below.

# Verification

- `RUN_KITCHEN_BOARD_E2E=1 playwright test e2e/station-boards.spec.ts --project=mobile` on `pnpm build`: all 3
  passed. The actions case failed once on an ambiguous alert locator (Next's route announcer is also an alert); it
  passed after the fix.
- `RUN_TICKET_MOVE_DB_TESTS=1 vitest run scripts/__tests__/move-ticket.integration.test.ts`: 4 passed, twice.
- Unit tests: `ticket-status` 13, and `move-ticket-response` with `station-board` 19, all passed.
- `pnpm typecheck` and ESLint: clean.

# Not tested and limitations

- **The guest's order page doesn't show these statuses yet;** that's TICKET-075.
- **There's no undo for served or cancelled.** A mistake there means placing the order again.
- **Not checked on real tablets** (TICKET-076's manual check covers the board).

# Risks and rollout

- **Migration 0030 is additive:** a new table, so existing rows are unaffected.
- **Rollback:** revert the PR. The table can stay, or a follow-up migration can drop it with your approval.

# Screenshots

`docs/reviews/TICKET-078/375-board-actions.png`, `docs/reviews/TICKET-078/375-cancel-sheet.png`

# Harness changes, if any

None.
