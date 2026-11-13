# Ticket

Ticket: TICKET-094

# Summary

Every table needs a printed card with its number, the shared order QR and the venue Wi-Fi (PRD ADM-2). Admins
can now open **Seating → Print table cards** (`/admin/guests/seating/cards`) and print or save a PDF with one
themed A6 card per table. The Wi-Fi name and password are set in **Settings**.

# Changes

- **Settings:** `event_settings` gains `wifi_name` and `wifi_password` (migration `0035_wifi-settings.sql`,
  two nullable columns, nothing destructive). The settings form validates them: name up to 32 characters,
  password 8 to 63 and not trimmed, both optional.
- **Card data** (`src/modules/admin/lib/table-cards.ts`): one card per table sorted by number, blank names
  dropped; the order link is `NEXT_PUBLIC_SITE_URL` + `/order`; Wi-Fi is printed only once a name is set.
- **Page:** `AdminTableCards` (server, admin-gated) and `TableCardList` reuse the shared `QrCode` (theme
  `qr-ink` on `qr-paper`, four-module quiet zone) and the existing print button. Empty and error states point
  to the seating plan, settings or a retry. The route is registered in `appRoutes` as `adminTableCards`, and
  the seating plan links to it.
- **Print CSS** (`table-cards.css`): the admin chrome and controls are hidden, and each card is a named page of
  `105mm 148mm` (A6 portrait), one per page, keeping theme colours. Chromium ignores the `A6` keyword, so
  millimetres are used.

# Acceptance criteria and evidence

- [x] **The QR on a printed card decodes to the /order URL (rasterised test).** Unit:
      `table-cards.test.tsx` rasterises each rendered card's SVG and decodes it with jsQR to
      `https://…/order`. Browser: `e2e/admin-table-cards.spec.ts` screenshots the painted QR on the real admin
      page and decodes it to `NEXT_PUBLIC_SITE_URL/order`.
- [x] **One card per table, numbers correct (unit).** Unit tests cover ordering, names and the empty
      case. The browser test checks the card count equals the `tables` row count, the headings are in number
      order, and the PDF has exactly one A6 page per table.

Not done: the ticket's manual check, printing a card on paper and scanning it with a phone. It needs a printer
and real devices, and printing for the day is TICKET-160.

# Verification

- `pnpm lint`, `pnpm typecheck`: pass.
- `vitest run src/modules/admin src/modules/shared`: 106 files, 719 tests pass (after registering the route).
- `tsx scripts/test-admin-table-cards.ts` (real email-code and TOTP admin sign-in on this worktree's local
  stack, production build): **1 passed**. It covers the redirect when signed out, the seating link, card
  count and order, Wi-Fi on every card, QR decoding from pixels, axe with no violations in all four themes at
  375px, no horizontal scroll at 375/600/768/1280, keyboard printing, print media hiding the navigation, and a
  3-page PDF of `298.08 × 420` points.
- `pnpm db:migrate` applies `0035` locally.

# Risks and rollout

- Migration `0035` only adds two nullable columns; rollback can leave them. Another open PR (#161, TICKET-079)
  adds a migration too; whichever merges second regenerates its number with `pnpm db:generate`.
- The Wi-Fi password is shown to signed-in admins and printed on cards by design. It is never logged and the
  route is `no-store` behind admin MFA. Use the guest network's password.
- The QR target follows `NEXT_PUBLIC_SITE_URL`, so cards must be printed after the real domain is live
  (TICKET-146). #163 (TICKET-228) removes TICKET-145/146 from this ticket's blockers.

# Screenshots

Admin screen scope: one theme at 375px is required; all four were captured.

- `docs/reviews/TICKET-094/desktop/ivory-gold-375.png`
- `docs/reviews/TICKET-094/desktop/blush-sage-375.png`
- `docs/reviews/TICKET-094/desktop/emerald-night-375.png`
- `docs/reviews/TICKET-094/desktop/midnight-champagne-375.png`
- Printed output: `docs/reviews/TICKET-094/desktop/table-cards.pdf` (3 A6 pages, inspected)

# UI checklist

- [x] **Screenshots:** PASS. Four themes at 375px, paths above, inspected.
- [x] **Tokens:** PASS. Only theme classes (`bg-surface`, `border-border`, `text-foreground`, `fill-qr-*`);
      the print CSS has no colours, fonts, radii or shadows.
- [x] **Restraint and typography:** PASS. One idea per card; display serif for the table number, uppercase
      0.12em labels, body text at least 16px.
- [x] **Mobile:** PASS. No horizontal scroll at 375/600/768/1280 (browser test); links and button are at
      least 44px tall.
- [x] **Motion:** N/A. No animation added.
- [x] **Keyboard:** PASS. The print button is focused and activated with Enter in the browser test; links are
      native.
- [x] **Contrast:** PASS. axe with no violations in all four themes; meaning isn't carried by colour.
- [x] **Load and images:** N/A. No images; the QR is an inline SVG with fixed aspect ratio.
- [x] **Performance:** N/A. Admin-only route.
- [x] **Copy:** PASS. Short, warm wording; empty and error states give the next step. Provisional copy: "Scan
      to order food and drinks."
- [x] **Shared components:** PASS. Reuses `QrCode`, `RetryButton` and the existing print button; the card is
      specific to this page, so it isn't a new shared pattern.
- [x] **Sharing and devices:** N/A. Admin-only page, not shared.
- [ ] **QR codes:** Partly verified. Contrast and the four-module quiet zone come from the shared QR; decoding
      is verified from rendered pixels. **Not verified:** scanning a printed card on iOS and Android.
- [x] **Staff feedback:** N/A. Not a staff screen.
- [ ] **Verification:** `t:pr` runs `verify:quick`; CI runs the full gate. Result recorded on the PR.

# Harness changes, if any

None.
