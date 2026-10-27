# Ticket

Ticket: TICKET-021

# Summary

A full UI review of `/` and `/dev/theme` in all four presets at 375, 768 and 1280px, before feature pages build on the component library. Most things passed, but the review found two real accessibility bugs in shared components, both now fixed and covered by a new regression test:

1. **Invisible focus rings for 150ms.** `Button` used `transition-colors`, which also animates `outline-color`. On focus, the outline faded in from the label colour (white on an ivory page is 1.07:1), so a keyboard user briefly saw no focus at all. This happened in every theme.
2. **Long names pushed the page sideways on phones.** A long single-word guest name in a staff `StatusPanel` (36px scanner type) stretched the whole panel grid to 406px at 375px. Names like this will be on the real guest list, and the scanner is phone-first.

# Changes

- `src/modules/shared/components/ui/button.tsx`: transition limited to `color`, `background-color`, `border-color`; the focus outline now appears instantly in the theme's `ring` colour.
- `src/modules/shared/components/ui/status-panel.tsx`: identifier uses `wrap-anywhere` (`overflow-wrap: anywhere`), which also lowers min-content width so grids can't be stretched.
- `src/modules/theming/components/theme-showcase.tsx`: a long-name example panel on `/dev/theme`.
- New `e2e/theme-review.spec.ts`, in every preset at 375px:
  - Tabs through every control and requires an outline of at least 2px at 3:1 or more against the page.
  - Checks a long name wraps inside its panel and the page doesn't scroll sideways.
- `e2e/a11y.spec.ts`: the staff-panel test takes the first "Valid" panel, since there are now two.

# Acceptance criteria and evidence

- [x] Every UI checklist item has PASS/FAIL/N/A evidence: see the ticket notes and the checklist below.
- [x] No blocker remains; deferred should-fix items listed with reasons (disabled/loading button opacity; mid-word breaks for very long names).
- [x] Every preset and all base components at 375/768/1280, with AA pairs, 44px targets, visible focus and long-name wrapping recorded. Evidence: the screenshots plus the a11y, theme-review, typography and overflow specs.

# Verification

- `e2e/theme-review.spec.ts`: failed before the fixes (focus ratios 1.01–2.91:1 on buttons in two themes; scrollWidth 406 at 375). After the fixes, 8/8 pass.
- Review set against the dev server: a11y, motion (including reduced motion), typography, decorations, QR, stepper focus, overflow, theme review and smoke specs. 108 passed, 69 skipped (each test runs only in its phone or desktop project).
- Shared unit tests: 124 passed.
- `pnpm verify`: run by `t:pr`; see CI.
- Not verified: Lighthouse, real devices.

# Risks and rollout

- Buttons no longer animate `box-shadow` or `outline`; hover fades are unchanged.
- No data or migration. Rollback: revert this PR.

# Screenshots

`SCREENSHOT_ROUTES=/,/dev/theme pnpm screenshots` → `artifacts/screenshots/<theme>/<width>/`. Inspected: staff panels with the long name at 375 (wraps inside the panel), buttons and QR at 768 and 1280.

# UI checklist

- [x] **Screenshots:** `/` and `/dev/theme`, 3 widths × 4 themes, inspected.
- [x] **Tokens:** Class-only changes; no literal colours.
- [x] **Restraint and typography:** Typography spec passes in every theme.
- [x] **Mobile:** No sideways scroll after the fix; 44px targets pass.
- [x] **Motion:** Reduced motion passes; the outline is no longer animated.
- [x] **Keyboard:** Every Tab stop visible at 3:1 or more in every theme; Sheet focus/Escape/return pass.
- [x] **Contrast:** Contrast gate and axe pass in all four themes.
- [x] **Load and images:** CLS 0; no photographs.
- [ ] **Performance:** Lighthouse not run.
- [x] **Copy:** No guest copy changes.
- [x] **Shared components:** Fixes made in the shared components; shown on `/dev/theme`.
- [ ] **Sharing and devices:** Not tested on real devices.
- [x] **QR codes:** Unchanged; decode spec passes in every theme.
- [x] **Staff feedback:** Staff sizes and status meanings pass in every theme.
- [x] **Verification:** `pnpm verify` — see CI.

# Harness changes, if any

None.
