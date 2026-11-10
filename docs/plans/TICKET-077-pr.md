# Ticket

Ticket: TICKET-077

# Summary

Before this change, `/bar` showed "coming soon" after sign-in. It now shows a live drinks board, built from the same
component as the kitchen board (TICKET-076). Each station sees only its own tickets: a guest order with food and
drinks becomes a kitchen ticket and a bar ticket. A bar PIN or bar device can't open the kitchen.

**Stacked on #140 (TICKET-076):** merge that first; this diff then shrinks to the bar changes.

# Changes

- **`src/modules/ordering/lib/station-board.ts`:**
  - adds `barBoardSchema`, where bar tickets have no dietary field
  - adds `boardSchemas` and the `StationBoard` / `StationTicket` types
- **`src/modules/ordering/server/station-board.ts`:** `readStationBoard(db, station)`.
  - The bar path stops before the guests query, so it never reads dietary notes.
  - The kitchen path is unchanged.
- **`station-board-response.ts`** and **`station-board-route.ts`** (the second replaces `kitchen-board.ts`):
  - each response is checked against that station's contract
  - each station's live session is checked on every read
  - new route `GET /api/bar/board`
- **`components/station-board.tsx`** and **`station-screen.tsx`** (renamed from `kitchen-board` and
  `kitchen-station`): take a `station` prop. `/kitchen` and `/bar` both render `StationScreen`.
- **`e2e/station-boards.spec.ts`** (renamed from `kitchen-board.spec.ts`): adds the routing and PIN-separation test.
- **Unit tests:** two bar-response tests.
- **Screenshot:** `docs/reviews/TICKET-077/375-bar-board.png`.

# Acceptance criteria and evidence

- [x] **Drink orders appear only on `/bar`, food only on `/kitchen` (e2e).**
  - The test signs a kitchen tablet and a bar tablet in with their own PINs, in separate browser contexts.
  - It places a mixed order (2 pepper soup, 3 Chapman). Within 2 s, the kitchen card shows the soup, not the
    Chapman; the bar card shows "3 × Chapman", not the soup.
  - The table's "Shellfish allergy" shows on the kitchen card only; the bar card has no "Dietary" section.
  - A drinks-only order appears on the bar and never on the kitchen (checked after a further second).
- [x] **PIN separation tested.**
  - The signed-in bar device, opening `/kitchen`, gets the PIN sign-in, not the board. Entering the bar PIN there
    doesn't sign it in.
  - `GET /api/kitchen/board` with the bar device's cookies returns 403, and `GET /api/bar/board` with the kitchen's
    does too.

# UI checklist (staff screen scope)

- **Screenshots:** PASS. Bar board at 375 px in one theme, inspected. The large ages ("503 h") come from the seed's
  old orders.
- **Tokens:** PASS. No new styles: the same component as the kitchen board.
- **Restraint and typography:** PASS. Table numbers 36 px, body at least 18 px.
- **Mobile:** PASS. No horizontal scroll (asserted on the kitchen board, same layout); buttons 52 px tall.
- **Motion:** PASS. Unchanged from TICKET-076: an opacity-only flash, and none under reduced motion.
- **Keyboard:** PASS. Native buttons only.
- **Contrast:** PASS. The axe scan of `/bar` in every theme at 375 px found no WCAG A or AA violations.
- **Load and images:** N/A. No images.
- **Performance:** N/A. Staff screen.
- **Copy:** PASS, provisional. "Bar board" and "Bar sign-in required.", plus the board copy from TICKET-076.
- **Shared components:** PASS. One shared board for both stations, as the ticket asks.
- **Sharing and devices:** N/A. Staff screen.
- **QR codes:** N/A.
- **Staff feedback:** PASS. Same flash and chime as the kitchen.
- **Verification:** see below.

# Verification

- `RUN_KITCHEN_BOARD_E2E=1 playwright test e2e/station-boards.spec.ts --project=mobile` on `pnpm build`: 2 passed
  (kitchen and bar).
- `vitest run src/modules/ordering/__tests__/station-board.test.ts`: 15 passed.
- `pnpm typecheck` and ESLint: clean.

# Not tested and limitations

- **Real tablets:** neither board has been checked on one yet (TICKET-076's manual criterion).
- **Bar sound and wake lock** use the same code as the kitchen; they weren't tested separately on the bar.

# Risks and rollout

- No migration. Signed out, `/bar` shows the same PIN sign-in as before.
- **Rollback:** revert the PR.

# Screenshots

`docs/reviews/TICKET-077/375-bar-board.png`

# Harness changes, if any

None.
