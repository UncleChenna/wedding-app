# Ticket

Ticket: TICKET-075

# Summary

After a guest sends an order, the confirmation now shows a live status under each station's items: Received, then
"Being prepared", then "Served. Enjoy every bite." (approved PRD copy). It follows the kitchen and bar boards
(TICKET-078) within 2 seconds.

**Stacked on #156 (TICKET-078):** merge that first.

# Changes

- **`src/modules/ordering/lib/order-status.ts`** (new):
  - the status contract, a strict list of `{ station, status }` and nothing else
  - the v4 receipt check
  - the copy
  - `isSettled` and `nextPollMs`: 1.5 s, doubling after each failure up to 15 s, or the server's `Retry-After`
- **`server/order-status.ts`** (new) and `GET /api/orders/[orderId]/status`:
  - reads only `station_orders.station` and `status` for that order
  - malformed and unknown receipts get the same 404
  - the response is checked against the strict contract
  - rate-limited with the `lookup` budget; responses are `private, no-store`
- **`components/order-status-live.tsx`** (new): one poll per order, shared by both station groups through a render
  prop.
  - The fetcher is held in a ref, so the effect only re-runs when the order changes.
  - Status updates are announced politely.
  - "We'll keep checking. The signal is slow." appears after repeated failures.
- **`components/order-composer.tsx`:** the sent screen keeps the server's order id and shows a status line per
  station.
- **Tests:**
  - `__tests__/order-status.test.tsx`: 7 tests on the receipt, rules, response privacy, and polling with fake timers.
  - `e2e/order-status.spec.ts`: a guest browser and a kitchen tablet side by side.
- **Screenshots:** `docs/reviews/TICKET-075/mobile/<theme>/{375,768,1280}-served.png` in all four themes.

# Acceptance criteria and evidence

- [x] **A board status change shows on the guest page within 2 s (e2e).**
  - The guest orders on `/order`, and a separate context signs in to `/kitchen` with a PIN.
  - "Start preparing" leads to "Being prepared" on the guest page in under 2,000 ms. "Served" leads to "Served.
    Enjoy every bite." in under 2,000 ms.
  - The whole run makes fewer than 20 status requests, and none in the 4 s after the order settles.
- [x] **Another submission's id can't be guessed (at least 96 bits, unit).**
  - The receipt is the server's `gen_random_uuid()` order id: a v4 UUID with 122 random bits.
  - Non-v4 values are refused before any database read.
  - The e2e checks that the polled receipt matches the v4 pattern, and that a fresh random UUID gets 404.
- [x] **Anonymous status responses disclose only public status information.**
  - The response is exactly `{ stations: [{ station, status }] }`: no guest, table, items, notes or dietary details.
  - A loader that returns extra fields gets a 503, not a leak (unit).
  - The e2e reads a live response and compares it whole.

# UI checklist (guest page, full scope)

- **Screenshots:** PASS. 12 screenshots: four themes at 375, 768 and 1280 px. The 375 px ivory-gold and
  emerald-night ones were inspected.
- **Tokens:** PASS. Only existing classes (`type-label`, `text-muted-foreground`); no new colours.
- **Restraint and typography:** PASS. One quiet status line per station; body 18 px; label in small caps.
- **Mobile:** PASS. No horizontal scroll at any width, asserted in every theme. No new tap targets.
- **Motion:** PASS. No animation added.
- **Keyboard:** PASS. No new controls. The status is plain text in a polite live region.
- **Contrast:** PASS. The axe scan in every theme at 375, 768 and 1280 px found no WCAG A or AA violations.
- **Load and images:** PASS. No images. The status line takes its place under the items when the sent screen
  opens; it shows "Checking on your order…" until the first answer.
- **Performance:** NOT VERIFIED. Lighthouse mobile wasn't run for `/order` in this change. The page only adds a
  small client hook.
- **Copy:** PASS. "Served. Enjoy every bite." is the approved PRD copy. Provisional: "Being prepared", "Cancelled.
  Please ask a member of staff.", "Checking on your order…" and "We'll keep checking. The signal is slow."
- **Shared components:** PASS. No new shared pattern.
- **Sharing and devices:** NOT VERIFIED. The ordering flow hasn't been tested in WhatsApp's in-app browser on real
  iOS and Android phones.
- **QR codes:** N/A. No QR output changed.
- **Staff feedback:** N/A. Guest page.
- **Verification:** see below.

# Verification

- `RUN_ORDER_STATUS_E2E=1 playwright test e2e/order-status.spec.ts --project=mobile` on `pnpm build`: 1 passed.
  The first run caught the polling flood (936 requests); it passed after the fix.
- `vitest run src/modules/ordering`: all passed, including the 7 new tests.
- `pnpm typecheck` and ESLint: clean.

# Not tested and limitations

- **Lighthouse and real-device WhatsApp checks** (above).
- **Shared venue Wi-Fi:** about 30 guests polling at once fit the `lookup` budget (1,200 a minute per network
  identity), but a whole room polling behind one IP needs the shared-network review the budget code already flags.
- **No status after a reload:** reloading the page loses the confirmation, as before. Keeping it is out of scope.

# Risks and rollout

- No migration.
- **Rollback:** revert the PR.

# Screenshots

`docs/reviews/TICKET-075/mobile/ivory-gold/375-served.png` and the other 11 in that folder.

# Harness changes, if any

None.
