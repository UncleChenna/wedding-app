# Ticket

Ticket: TICKET-020

# Summary

The printed-invitation feel depends on hairline dividers, a monogram and paper texture. Until now there was no shared way to draw them, so each screen would have hand-rolled its own. This PR adds three theme-driven components, `Divider`, `Monogram` and `Paper`, and shows them on `/dev/theme` in every theme.

While testing it in both themes I found and fixed a bug. A theme without a pattern inherited the paper texture of a patterned theme around it: midnight-champagne showed ivory-gold's grain inside `/dev/theme`. Themes without a pattern now reset the pattern variables explicitly.

# Changes

- `src/modules/shared/components/ui/decorations.tsx` (new):
  - `Divider` is a separator with a hairline in the `border` token and a small diamond ornament in `primary`, hidden from assistive technology. `variant="staff"` is a plain, lighter `<hr>` with no ornament, for staff and admin screens.
  - `Monogram` shows the couple's initials in the display font inside a hairline `primary` ring. It is announced once as "A & G monogram", or hidden with `decorative` when the names are already nearby. Initials are a prop until event settings exist (TICKET-025).
  - `Paper` is a panel wrapper with an `aria-hidden`, non-interactive `.paper-texture` layer. It is plain when the theme has no pattern.
- `src/app/globals.css`: adds `.paper-texture`, which uses the same mask, colour and opacity variables as the page-level `.theme-pattern`, scoped to the panel.
- `src/modules/theming/lib/css-vars.ts`: themes without a pattern emit `--t-pattern-image: none` and `--t-pattern-opacity: 0`, so they reset rather than inherit. The unit test in `pattern.test.ts` was updated to the stricter expectation.
- `src/modules/theming/components/theme-showcase.tsx`: new Decoration section (`data-testid="decorations"`).
- `src/modules/shared/components/ui/index.ts`: exports the new components.
- `docs/theming.md`: new "Dividers, monogram and paper" section, and the pattern placement rule now names `<Paper>` as the one sanctioned panel texture.
- Tests:
  - `src/modules/shared/__tests__/decorations.test.tsx` covers semantics, the decorative/named monogram, the hidden texture layer, and a literal-colour scan of the component source.
  - `e2e/decorations.spec.ts` (`@smoke`) checks per theme that the texture matches the theme pattern (or opacity 0) and that the ring and hairline colours resolve to that theme's tokens.

# Acceptance criteria and evidence

- [x] **Components use only theme tokens (lint passes, no literals).**
  - Only token classes are used (`border-border`, `text-primary`, `bg-card`, `font-display`).
  - The unit test scans `decorations.tsx` for hex/rgb/hsl/oklch literals and finds none.
  - `pnpm lint` passes with zero warnings.
  - The e2e test confirms the rendered ring equals `--t-color-primary` and the hairline equals `--t-color-border` in each theme.
- [x] **Demonstrated on /dev/theme in all themes.** The Decoration section renders in ivory-gold and midnight-champagne, and the e2e test iterates over `listThemes()`.

# Verification

- `pnpm vitest run`: 24 files, 218 tests passed (7 new).
- `e2e/decorations.spec.ts`: 4 passed (2 themes × mobile/desktop). It failed first on the inherited-texture bug and passed after the fix.
- `e2e/a11y.spec.ts` (axe on `/dev/theme`, 44px targets), `overflow.spec.ts` and `theme-pattern.spec.ts` passed.
- `pnpm verify` on `develop` 36fdf31 merged in: format, lint, types, unit, build and 44 browser smoke tests passed.

# Risks and rollout

- Low risk: new components, not yet used on guest routes.
- The `css-vars` change only affects themes without a pattern (midnight-champagne). On real pages they had no inherited value, so the visible result is unchanged; it only matters for nested theme scopes such as `/dev/theme`.
- Not yet done: wiring monogram initials to event settings (TICKET-025/037), and switching the monogram to the script font role when TICKET-015 lands.
- Rollback: revert the PR.

# Screenshots

Local, not committed (in `artifacts/screenshots/`):

- `decorations-ivory-gold-375.png` and `decorations-midnight-champagne-1280.png`: the decoration crops. Ivory shows faint grain inside the panel; midnight is plain.
- `{ivory-gold,midnight-champagne}/{375,768,1280}/dev_theme*.png`: the full-route set.

To reproduce: `SCREENSHOT_ROUTES=/dev/theme pnpm screenshots`.

# UI checklist

- [x] **Screenshots:** `/dev/theme` at 375/768/1280 in both themes, plus decoration crops at 375/1280; inspected.
- [x] **Tokens:** No literals in changed components (unit scan and grep). Pattern variables come from the theme.
- [x] **Restraint and typography:** One ornament, hairline weights, display font for names. Labels are uppercase with wide tracking; body text is 16px with relaxed leading in `max-w-prose`.
- [x] **Mobile:** `overflow.spec.ts` passes at 375px. There are no new tap targets: the decorations are non-interactive and the texture has `pointer-events: none`.
- [x] **Motion:** N/A, no animation added.
- [x] **Keyboard:** N/A, no interactive elements. The separator and monogram names are exposed correctly; the ornament and texture are `aria-hidden`.
- [x] **Contrast:** The axe scan on `/dev/theme` passes in both themes. The monogram text uses `primary` on `card`.
- [x] **Load and images:** No raster images. The texture is a CSS mask on an absolutely positioned layer, so there is no layout shift.
- [ ] **Performance:** Not verified: the components are not yet on a guest route, and Lighthouse via npx is not permitted in this environment.
- [x] **Copy:** The demo copy on `/dev/theme` is provisional and not guest-facing.
- [x] **Shared components:** Added to the shared UI and to `/dev/theme`.
- [x] **Sharing and devices:** N/A: no guest route changed.
- [x] **QR codes:** N/A.
- [x] **Staff feedback:** The staff divider variant is plain and lighter. No status colours are involved.
- [x] **Verification:** `pnpm verify` passed.

# Harness changes, if any

- None.
