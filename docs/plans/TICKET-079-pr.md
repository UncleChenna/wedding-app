# Ticket

Ticket: TICKET-079

# Summary

When a guest's phone can't connect, a waiter can take their order by voice and enter it from the kitchen or bar
board (PRD connectivity plan).

- **Entering it:** "New order" opens a bottom sheet with the table number and the same menu guests see, with the same
  caps and sold-out states, plus a note.
- **Where it goes:** the order splits to the kitchen and bar like any other and is flagged "Staff order" on both
  boards.
- **Limits:** it skips the table cooldown, which only slows repeated taps from a guest's phone. The open-order
  limit and item caps still apply.

# Changes

- **Migration `drizzle/0031_staff-entered-orders.sql`** (generated, additive): nullable
  `orders.entered_by_staff_id`, referencing staff with `ON DELETE SET NULL`.
- **`lib/order-limits.ts`:** `rejectTableUsage(..., { staffEntered })` skips only the cooldown.
- **`server/create-order.ts`:**
  - passes `staffEntered` to the limit check
  - records `enteredByStaffId`
  - still allows staff orders while guest ordering is closed, as before
- **`server/staff-order-route.ts`** and `POST /api/{kitchen,bar}/orders`:
  - live station session check; 403 without one
  - then the guest order handler: same JSON-only body, 8 KB limit, schema, replay safety and plain errors
- **Board:**
  - tickets carry `staffEntered`, and cards show a "Staff order" label
  - the header labels now wrap: at 375 px, "New", "Staff order" and the age overflowed the card
- **`components/staff-order-sheet.tsx`** (new): shared `Sheet`, `Input`, `MenuSections`, `Textarea` and `Button`.
  - One request id per attempt, so a double tap can't create two orders.
  - Refusals use the guest order wording, and the board shows "Order sent for table N."
  - **Menu:** the station screen loads it for the sheet.
- **Tests:**
  - `order-limits` unit tests for the exemption.
  - A fourth case in `e2e/station-boards.spec.ts`.
  - The spec now runs serially, resetting the localhost PIN sign-in budget before each test.

# Acceptance criteria and evidence

- [x] **A staff-entered order appears on the right board and is flagged staff-entered (e2e).**
  - From the kitchen tablet, the waiter enters 2 soups and 1 Chapman for a table.
  - The kitchen card shows "2 × Pepper soup" with "Staff order". The bar tablet's card shows "1 × Chapman" with
    "Staff order", within 2 s.
  - Both orders store `entered_by_staff_id` as that staff member.
- [x] **Staff-entered orders bypass the cooldown but not item caps (unit).**
  - `rejectTableUsage` refuses a guest order 1 s after the last one (cooldown) but allows a staff one.
  - It still refuses a staff order once the table has 3 open orders.
  - `overLimitItemIds` is unchanged for staff orders.
  - In the e2e, a second staff order for the same table straight after the first is accepted.

# UI checklist (staff screen scope)

- **Screenshots:** PASS. `docs/reviews/TICKET-079/375-new-order-sheet.png` and `375-staff-order-card.png`,
  inspected. The overflowing card header found there was fixed and re-checked.
- **Tokens:** PASS. Shared components and theme classes only.
- **Restraint and typography:** PASS. One primary action per sheet ("Send order"); body at least 18 px.
- **Mobile:** PASS. A bottom sheet; 44 px and larger steppers and buttons; no horizontal scroll.
- **Motion:** PASS. No new animation.
- **Keyboard:** PASS. The table number, steppers and note are labelled. The shared dialog handles focus and Escape.
- **Contrast:** PASS. The axe scan in every theme at 375 px, with the sheet open, found no WCAG A or AA violations.
- **Load and images:** N/A. No images.
- **Performance:** N/A. Staff screen.
- **Copy:** PASS. Guest order wording is reused. Provisional: "New order", "New order for a table", "Enter the table
  number." and "Order sent for table N."
- **Shared components:** PASS. Reused the menu and form components; no new shared pattern.
- **Sharing and devices:** N/A. Staff screen.
- **QR codes:** N/A.
- **Staff feedback:** PASS. Sending disables the form, and success or refusal shows at once.
- **Verification:** see below.

# Verification

- `RUN_KITCHEN_BOARD_E2E=1 playwright test e2e/station-boards.spec.ts --project=mobile` on `pnpm build`: 4 passed,
  four times in a row after the serial and PIN-budget fixes.
  - Before those fixes, parallel workers signed each other out, and repeated runs hit the localhost PIN limit.
- `vitest run src/modules/ordering`: all passed (134 before this ticket's tests, plus the new ones).
- `pnpm typecheck` and ESLint: clean.

# Not tested and limitations

- **No real-tablet check** (as for TICKET-076).
- **Staff orders don't record a guest name.** Only the table and note are kept.

# Risks and rollout

- **Migration 0031 is additive:** a nullable column, so existing orders are unaffected.
- **Rollback:** revert the PR. The column can stay.

# Screenshots

`docs/reviews/TICKET-079/375-new-order-sheet.png`, `docs/reviews/TICKET-079/375-staff-order-card.png`

# Harness changes, if any

`e2e/station-boards.spec.ts` runs serially and resets the localhost PIN budget per test (test-only).
