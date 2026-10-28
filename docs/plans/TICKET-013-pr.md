# Ticket

Ticket: TICKET-013

# Summary

The PRD (THM-5) asks for three or four preset themes for the couple to start from; the site had two. This adds the two alternates from the invitation design spike: **Emerald Night**, a rich evening dark theme, and **Blush & Sage**, a soft garden light theme. Both pass every theme gate. The live pair is unchanged (Ivory & Gold for light devices, Midnight & Champagne for dark), so guests see no difference; the new presets are available to switch into via `config.ts` and later the admin theme editor.

# Changes

- `src/modules/theming/themes/emerald-night.json` (dark; Playfair Display + Inter; emerald `#102D27`, cream text, champagne `#DDC18C` actions).
- `src/modules/theming/themes/blush-sage.json` (light; Cormorant Garamond + Jost; blush `#F9EFEC`, deep green text, sage `#49634E` actions).
- Registered both in `themes/index.ts`, so `/dev/theme`, the e2e theme loops and screenshots cover them automatically.
- `docs/theming.md`: a Presets table.

The spike defined seven colours per theme. I derived the others (surfaces, secondary, input, ring, the three status sets, decorative and QR) to keep each theme's mood while meeting the gates. QR is the spike's `#18251F` on white in both. No paper pattern yet (optional; the spike SVGs need converting to the mask format).

# Acceptance criteria and evidence

- [x] Four themes registered and listed on `/dev/theme`. Evidence: `load-theme.test.ts` registers every JSON file and passes schema + AA for each; smoke spec renders all four sections.
- [x] Screenshots of `/dev/theme` at 375/768/1280 in all four themes. Evidence: `artifacts/screenshots/{ivory-gold,midnight-champagne,emerald-night,blush-sage}/{375,768,1280}/`, inspected (home, order, and the status/decoration/QR sections).
- [x] `pnpm verify` passes. Evidence: run by `t:pr`; numbers below and in CI.
- [x] Spike font pairings used; status hues preserved. Evidence: the status-hue gate (`lib/status.ts`) passes for both; the panels read green/amber/red in the screenshots.

# Verification

- Unit: 405 passed, 10 skipped (opt-in database tests).
- Browser, dev server: axe a11y, decorations, typography (including CLS 0), QR decode, smoke — 39 passed, 5 skipped (phone-only), across all four themes.
- `SCREENSHOT_ROUTES=/,/dev/theme,/invite,/order,/checkin pnpm screenshots`: 60 passed.
- Not verified: long guest names on the scanner (the scanner page is not built yet, TICKET-059), real devices, Lighthouse.

# Risks and rollout

- Emerald Night and Blush & Sage are not active, so there is no guest-facing change.
- Blush & Sage uses Jost and Emerald Night uses Inter; both fonts are already loaded, so no new font downloads.
- Rollback: revert this PR.

# Screenshots

`SCREENSHOT_ROUTES=/,/dev/theme,/invite,/order,/checkin pnpm screenshots` → `artifacts/screenshots/<theme>/<width>/`.

# UI checklist

- [x] **Screenshots:** five routes × three widths × four themes, inspected.
- [x] **Tokens:** Theme JSON only; no component changes.
- [x] **Restraint and typography:** Each preset keeps three interface colours (background, text, one accent) plus status colours; font roles follow the spike.
- [x] **Mobile:** Overflow and tap-target specs unaffected by colour; screenshots show no overflow.
- [x] **Motion:** N/A — no motion changes.
- [x] **Keyboard:** N/A — no new controls; focus ring token passes 3:1 in both themes.
- [x] **Contrast:** Every pair gated; axe passes on `/dev/theme` in all four themes.
- [x] **Load and images:** CLS 0 test passes; no new fonts or images.
- [ ] **Performance:** Lighthouse not run; presets are inactive.
- [x] **Copy:** N/A — no copy changes.
- [x] **Shared components:** Unchanged; all shown on `/dev/theme` in the new themes.
- [ ] **Sharing and devices:** Not tested on real devices.
- [x] **QR codes:** Dark on light at 15.5:1+ in both, decoded in-browser by the QR spec.
- [x] **Staff feedback:** Status hue gate passes; panels verified in screenshots.
- [x] **Verification:** `pnpm verify` — see CI.

# Harness changes, if any

None.
