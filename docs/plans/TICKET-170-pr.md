# Ticket

Ticket: TICKET-170

# Summary

Guest passes, table cards and the printable invitation all need a QR code, and the site had no way to draw one or to keep it scannable in every theme. A dark theme could easily produce a light-on-dark code, which many phone cameras cannot read. The approved Ivory & Gold palette (ivory, champagne, chocolate) also had nowhere to live: champagne is too pale to be text, so it needs its own "fill only" token.

This PR adds four theme colours, a validation rule that keeps every theme's QR dark on light, and a shared `<QrCode>` component. The owner approved the `qrcode` dependency on 2026-10-27.

# Changes

- **Tokens** (`src/modules/theming/lib/schema.ts`): `decorative`, `decorative-foreground`, `qr-ink`, `qr-paper`, added to the existing `COLOR_TOKENS` (one token shape), mapped in `globals.css` and the regenerated `theme.schema.json`.
- **Validation** (`lib/contrast.ts`, `lib/load-theme.ts`)
  - New AA pairs: text on the decorative fill (4.5:1), QR ink on paper (4.5:1).
  - New `checkQrPolarity`: `loadTheme` rejects a theme whose QR ink is lighter than its paper.
- **Themes**
  - Ivory & Gold: champagne `#D6BE8D` fill, chocolate `#432B22` text and QR ink, ivory `#FFF9EF` QR paper.
  - Midnight & Champagne: champagne fill with near-black text; the QR stays dark (`#0F1420`) on light (`#F4EFE6`).
  - Existing tokens are unchanged, so current pages look the same.
- **QR** (`src/modules/shared/lib/qr.ts`, `components/ui/qr-code.tsx`)
  - Server-rendered SVG, crisp edges, medium error correction, four-module quiet zone, accessible name.
  - Imported from its own file, not the `ui` barrel, so client bundles never include the encoder.
- **`/dev/theme`**: a "Table 12" champagne label and a sample pass QR in each theme.
- **Dependencies**: `qrcode` 1.5.4; dev-only `@types/qrcode` 1.5.5 and `jsqr` 1.4.0 (decoder used by tests).
- **Docs**: `docs/theming.md` token rows and a "Decorative fill and QR codes" section.

# Acceptance criteria and evidence

- [x] Separate decorative and QR tokens with pair validation; schema regenerated; docs updated; one token shape. Evidence: `accent-qr-tokens.test.ts` (rejects a failing decorative pair, a low-contrast QR and a light-on-dark QR); `load-theme.test.ts` schema-up-to-date test.
- [x] Approved ivory, champagne and chocolate in the primary theme; champagne is fill only. Evidence: a test asserts the exact values and that champagne on the page fails AA (1.71:1), so it can never pass as text. Chocolate on champagne is 7.22:1.
- [x] Every preset renders a dark-on-light QR with a four-module quiet zone; status hues unchanged; AA pairs tested. Evidence:
  - `qr.test.ts` checks the quiet zone and decodes the code in each theme's colours with jsQR.
  - `e2e/qr-code.spec.ts` checks the painted fill colours and viewBox, then screenshots the rendered QR and decodes those pixels, in both themes on the phone and desktop projects.
  - Contrast: Ivory & Gold QR 12.47:1, Midnight & Champagne QR 16.07:1.

# Verification

- `pnpm verify` (format, lint, types, ticket validation, unit tests, build, browser smoke): see the PR's CI and the final numbers below.
- Before verify: theming + QR unit tests 63/63 passed; `e2e/qr-code.spec.ts` 4/4 passed; decorations, a11y and overflow specs passed against the dev server.
- Not verified: scanning with real iOS and Android cameras (TICKET-201 / TICKET-138). The codes decode from the browser's actual pixels, which is strong evidence but not a phone camera.

# Risks and rollout

- `qrcode` adds 23 small pure-JS packages. It is only imported by a server component today; a future client-side QR (e.g. offline pass) should check the bundle budget.
- The sample QR on `/dev/theme` encodes a placeholder URL; real signed passes come in TICKET-056.
- No migration. Rollback: revert this PR.

# Screenshots

`SCREENSHOT_ROUTES=/dev/theme pnpm screenshots` → `artifacts/screenshots/{ivory-gold,midnight-champagne}/{375,768,1280}/dev_theme*.png`. Inspected the QR and the champagne label at 375px in both themes: the QR keeps its light border inside the dark theme; the label is legible.

# UI checklist

- [x] **Screenshots:** `/dev/theme` at 375/768/1280 in both themes, inspected.
- [x] **Tokens:** New colours are theme tokens; components use `fill-qr-ink`, `fill-qr-paper`, `bg-decorative`, `text-decorative-foreground`. Lint rule against literal colours passes.
- [x] **Restraint and typography:** One small label and one QR; no new shadows or gradients.
- [x] **Mobile:** Overflow and 44px tap-target specs pass; the QR has no interactive parts.
- [x] **Motion:** N/A — no animation added.
- [x] **Keyboard:** N/A — nothing interactive added. The QR is `role="img"` with a name.
- [x] **Contrast:** New pairs gated in every theme (ratios above); axe passes on `/dev/theme`.
- [x] **Load and images:** The QR is an inline SVG sized by its container (`aspect-square`), so no layout shift. No photographs.
- [ ] **Performance:** Lighthouse not run; `/dev/theme` is not a guest page.
- [x] **Copy:** "Always dark on light, with a four-module quiet zone." is developer-facing.
- [x] **Shared components:** `QrCode` added to shared UI and shown on `/dev/theme`.
- [ ] **Sharing and devices:** Not tested on real devices.
- [ ] **QR codes:** Contrast and quiet zone verified and decoded in-browser; real iOS/Android scans not done.
- [x] **Staff feedback:** Status tokens unchanged and still gated.
- [x] **Verification:** `pnpm verify` — see CI.

# Harness changes, if any

None.
