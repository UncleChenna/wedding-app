# Ticket

Ticket: TICKET-204

# Summary

The couple wants each guest to see the theme that matches their phone: Midnight & Champagne in dark mode and Ivory & Gold in light mode. Before this change, one theme was hard-coded and written inline on `<html>`, so the device setting was ignored. Now the server sends both themes in one stylesheet, and the browser picks one from the device's appearance setting. The right theme shows from the first paint, with no flash and no JavaScript, and the page restyles live if the guest switches the setting. The phone's browser bar colour follows too.

The ticket also covers a phone usability pass over the whole site. Every page was checked at 375px in both schemes. The one real problem found: on the order menu, "Review order" sat below the entire menu. It is now pinned to the bottom of the screen on phones.

# Changes

- **Theme pair** — `src/modules/theming/config.ts`
  - `ACTIVE_THEME_IDS = { light: "ivory-gold", dark: "midnight-champagne" }` replaces `ACTIVE_THEME_ID`.
  - `DEFAULT_COLOR_SCHEME = "light"` is used where there is no viewer (OG image, seed).
- **Registry** — `lib/registry.ts`
  - `getActiveThemes()` and `resolveActiveThemes(ids)`. Both throw if a slot holds a theme of the other scheme.
  - `getActiveTheme(scheme?)`.
- **CSS** — `lib/css-vars.ts`
  - `activeThemesToCssText()` emits the light theme on `:root` and the dark theme inside `@media (prefers-color-scheme: dark)`.
  - It refuses `<`, so a theme value can never close the `<style>` element. This matters once themes come from the database (TICKET-012).
- **Root layout and `global-error.tsx`**
  - Render `<ThemeStyles>` in `<head>` instead of inline variables on `<html>`.
  - Add a `theme-color` per scheme and `color-scheme: light dark`.
- **Paper texture** — `<ThemePattern>` renders when either theme has a pattern. The plain dark theme resets the variables, so the grain shows only in light mode.
- **Dev previews** — `/dev/invitation`, `/dev/rsvp` and `/dev/order` default to "Match my device". Choosing a theme still pins it.
- **Phone layout** — new shared `ActionBar` (`src/modules/shared/components/ui/action-bar.tsx`).
  - Sticky at the bottom on phones and safe-area aware; an ordinary row from 768px.
  - Scroll padding keeps a focused field clear of the bar.
  - Used by the order menu step and shown on `/dev/theme`.
- **Seed** — both active themes are marked `isActive`.
- **Docs** — `docs/theming.md` and `docs/architecture.md` describe the pair and warn never to put theme variables inline on `<html>`.

# Acceptance criteria and evidence

- [x] Light renders Ivory & Gold and dark renders Midnight & Champagne on every route (incl. 404). Evidence: `e2e/color-scheme.spec.ts` checks computed body background, text colour and `color-scheme` for each scheme.
- [x] The server HTML carries both themes and `<html>` has no inline `--t-*` variables. Evidence: unit tests in `css-vars.test.ts`; e2e checks the raw HTML and inline styles.
- [x] `theme-color` exists per scheme (`#FBF8F3` light, `#0F1420` dark), plus `color-scheme: light dark`. Evidence: e2e.
- [x] The paper texture shows in light mode only; staff and admin stay plain. Evidence: `e2e/theme-pattern.spec.ts`, both schemes.
- [x] At 375px, no route scrolls sideways and no control is under 44×44px, in both schemes. Evidence: `e2e/overflow.spec.ts`.
- [x] Screenshots of all 13 routes at 375/768/1280 in both themes, regenerated on the final code and inspected side by side. No overflow, clipping or wrong-theme panels.
- [x] `pnpm verify` passes.

# Verification

- `pnpm verify`: format, lint, types and ticket validation pass.
  - Unit: 30 files, 275 tests passed.
  - Production build succeeded.
  - Browser: 235 passed, 81 skipped. The skipped ones are phone-only checks that the desktop project skips by design.
- Also run against the dev server:
  - `SCREENSHOT_ROUTES=<every route> pnpm screenshots`: 66 passed, no horizontal overflow.
  - A temporary audit of every route × both schemes at 375px (deleted afterwards).
- Not verified:
  - Real iOS/Android devices and the WhatsApp in-app browser (TICKET-201).
  - Lighthouse mobile scores.
  - Running the new e2e tests against the old code to watch them fail first.

# Risks and rollout

- Dark-mode guests now load Playfair Display and Jost. Both are `next/font` with `display: swap` and fallback metrics, so there is no layout shift, but the font swap may be briefly visible on slow connections.
- TICKET-012 (database-stored active theme) must now store a light/dark pair.
- No migration. Rollback: revert this PR.

# Screenshots

`pnpm screenshots` with `SCREENSHOT_ROUTES=/,/invite,/order,/checkin,/kitchen,/admin,/offline,/dev,/dev/theme,/dev/invitation,/dev/rsvp,/dev/order,/nope` writes `artifacts/screenshots/{ivory-gold,midnight-champagne}/{375,768,1280}/`. Order flow screenshots from verify are in `artifacts/ordering/`.

# UI checklist

- [x] **Screenshots:** Every route at 375/768/1280 in both themes, inspected.
- [x] **Tokens:** No hard-coded colours, fonts, radii or shadows in changed files (lint rule passes). `ActionBar` uses `bg-background` and `border-border`.
- [x] **Restraint and typography:** The bar is a hairline divider and the page background, with no shadow. No type changes.
- [x] **Mobile:** No overflow at 375px in both schemes (e2e). 44px targets (e2e). The sticky bar uses `env(safe-area-inset-bottom)`, and a focused field scrolls clear of it (e2e). Keyboard behaviour on real devices is not verified.
- [x] **Motion:** No new animation.
- [x] **Keyboard:** The bar is ordinary DOM order. Existing keyboard specs for the order flow pass.
- [x] **Contrast:** Both themes pass the contrast gate. Axe passes on every route in both themes.
- [x] **Load and images:** No images changed. CLS test passes. Fonts unchanged.
- [ ] **Performance:** Lighthouse not run.
- [x] **Copy:** "Match my device" is new, provisional wording.
- [x] **Shared components:** `ActionBar` is added to shared UI and shown on `/dev/theme`.
- [ ] **Sharing and devices:** Not tested on real devices or in WhatsApp.
- [x] **QR codes:** N/A — no QR output changed.
- [x] **Staff feedback:** Staff pages follow the same scheme, and status tokens are unchanged in both themes.
- [x] **Verification:** `pnpm verify` passed.

# Harness changes, if any

None.

## 2026-10-27 — requested merge integration

User explicitly requested merging PR43 into develop. Integrated develop3752e0591e225a0dd4421c84c225917dca270e29. The only content conflict was e2e/overflow.spec.ts: preserved both device schemes and tap-target coverage, and retained develop's expectedRouteStatus for the invalid-invitation404 fixture. No product behavior was changed by the conflict resolution.

The first full gate stopped in three hook tests because the merge staged TICKET-023's protected artifacts. Confirmed all three files byte-identical to origin/develop and recorded narrowly scoped authorization to carry those previously approved files unchanged. No migration was edited or applied.

Rerun pnpm verify passed: 364 unit tests,10 opt-in DB skips; build passed; browser287 passed,103 conditional skips,zero retries. Format/lint/types/ticket validation passed. Real devices, WhatsApp and Lighthouse remain under the previously disclosed QA limitations. Push integration and require final-head CI before the authorized merge.
