# Ticket

Ticket: TICKET-115

# Summary

Accessibility was only checked on `/dev/theme`, and only in the active theme's page chrome. Routes such as `/invite`, `/checkin`, `/admin` and the not-found page were never scanned, and nothing stopped a new page from slipping through. This PR makes WCAG A/AA a gate on every PR:

- every route is scanned with axe in every theme, on mobile and desktop;
- any A/AA violation fails, including "moderate" and "minor" ones;
- the route list cannot silently fall behind the app.

# Changes

- `e2e/support/routes.ts` (new): `PAGE_ROUTES` (the 7 pages), `NOT_FOUND_ROUTE` and `ALL_ROUTES`.
- `e2e/support/theme.ts` (new): `applyTheme(page, theme)`, moved out of the screenshot harness. It clears the active theme's `--t-*` variables, applies the target theme's, and waits for fonts.
- `e2e/support/axe.ts` (new):
  - `WCAG_AA_TAGS` covers wcag2a, 2aa, 21a, 21aa, 22a and 22aa. The old scan lacked `wcag21a` and `wcag22a`.
  - `scanA11y(page)` lets finite animations settle, then runs axe with no impact filter.
  - `describeViolations` gives readable diff lines.
- `e2e/a11y-routes.spec.ts` (new, `@smoke`):
  - Every route × theme has zero violations.
  - The route list covers every `page.tsx` under `src/app`, with route groups stripped and `[param]` segments matched against sample paths.
  - "An injected violation fails the scan" renders an unlabelled input and an image without alt text, and asserts that both are reported.
  - "Moderate and minor violations are not filtered out."
- `e2e/a11y.spec.ts`, `e2e/overflow.spec.ts` and `e2e/visual/screenshots.spec.ts` now use the shared helpers. There is no behaviour change apart from the wider tag list.
- `docs/engineering.md`: documents the route list, the gate and the helpers.

# Acceptance criteria and evidence

- [x] **Every route in e2e/routes is scanned in every theme (test list).** Each of the 8 routes is scanned in ivory-gold and midnight-champagne, on both mobile and desktop: 32 passing tests named `<route> in <theme> has no WCAG A/AA violations`.
- [x] **An injected violation fails the suite (proved in notes).**
  - A permanent test asserts that `label` and `image-alt` violations are reported for a broken fixture.
  - A mutation check removed `/admin` from the route list; the coverage test failed with `["/admin"]`, and the list was restored.
- [x] **Resolve all applicable WCAG A/AA violations regardless of axe severity.** There is no impact filter, and a test asserts that moderate and minor violations are kept. All current routes pass with zero violations, so there was nothing to fix.

# Verification

- `pnpm exec playwright test e2e/a11y-routes.spec.ts e2e/a11y.spec.ts e2e/overflow.spec.ts`: 50 passed, 12 skipped (mobile-only checks on desktop).
- `SCREENSHOT_ROUTES=/ pnpm screenshots`: 6 passed, which confirms the refactored `applyTheme`.
- `pnpm verify` on develop b0b5704 merged in: format, lint, types, 218 unit tests, build and 86 browser smoke tests passed.

# Risks and rollout

- The smoke suite grows by about 40 tests, adding roughly 8s locally.
- A new page now requires a line in `e2e/support/routes.ts`. This is intended, and the failure message says where to add it.
- axe cannot judge every criterion (for example meaningful focus order or captions). Manual audits stay in TICKET-117/118.
- Untested: real assistive technology (manual audit scope).
- Rollback: revert the PR.

# Screenshots

N/A: tests and documentation only; no UI change.

# UI checklist

- [x] **Screenshots:** N/A, no UI change. The screenshot harness still runs (6 passed).
- [x] **Tokens:** N/A.
- [x] **Restraint and typography:** N/A.
- [x] **Mobile:** N/A. Overflow checks are unchanged and use the shared list.
- [x] **Motion:** N/A. Scans wait for finite animations to settle.
- [x] **Keyboard:** N/A.
- [x] **Contrast:** axe `color-contrast` now runs on every route in every theme and passes.
- [x] **Load and images:** N/A.
- [x] **Performance:** N/A, no runtime change.
- [x] **Copy:** N/A.
- [x] **Shared components:** N/A.
- [x] **Sharing and devices:** N/A.
- [x] **QR codes:** N/A.
- [x] **Staff feedback:** N/A.
- [x] **Verification:** `pnpm verify` passed.

# Harness changes, if any

- None to hooks or CI. `e2e/support/` is new shared test tooling.
