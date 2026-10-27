# TICKET-204 handoff

## 2026-10-27 — TICKET-204 — Follow the device light/dark setting

- **Who / agent / branch:** unclechenna · claude · `TICKET-204`, base `develop` ea5e2fa.
- **Changed:**
  - `config.ts` now holds a light/dark pair: Ivory & Gold (light) and Midnight & Champagne (dark). `ACTIVE_THEME_ID` is gone; use `ACTIVE_THEME_IDS`, `getActiveThemes()`, or `getActiveTheme(scheme?)`.
  - The root layout and global error page render one `<ThemeStyles>` stylesheet keyed on `prefers-color-scheme`. They add a `theme-color` meta per scheme and `color-scheme: light dark`.
  - The guest paper texture shows in light mode only.
  - Dev previews default to "Match my device".
  - New shared `ActionBar` (sticky on phones) used by the order menu step and shown on `/dev/theme`.
  - Seed marks both active themes `isActive`.
- **Checks:**
  - `pnpm verify` passed: 275 unit tests, build, 235 browser tests (81 phone-only checks skipped in the desktop project by design).
  - New/changed specs: `e2e/color-scheme.spec.ts`, `e2e/overflow.spec.ts` (both schemes plus 44px targets), `e2e/theme-pattern.spec.ts`, and a sticky-bar test in `e2e/order-preview.spec.ts`.
- **Not verified:**
  - Real phones and the WhatsApp in-app browser (TICKET-201).
  - Lighthouse scores.
  - The new e2e tests were not run against the old code to watch them fail first.
- **Learned:** The harness hook rejects shell commands containing `>/dev/null` or heredoc file writes ("edit outside this checkout"). Use the Write/Edit tools and drop redirects.
- **Next / blockers:**
  - Human review of the PR into develop.
  - TICKET-012 (database-stored theme) must store a light/dark pair, not one active theme.
