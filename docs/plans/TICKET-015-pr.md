# Ticket

Ticket: TICKET-015

> **Draft: one criterion is blocked on an owner decision.** "Lighthouse reports CLS 0 on `/dev/theme`" can't be run in this session. `npx lighthouse` was denied (external code), and adding Lighthouse as a dependency needs lockfile approval. An e2e test measures CLS with the same browser API Lighthouse uses and gets exactly **0**. Please either approve Lighthouse, or accept the e2e measurement and amend the criterion. Everything else is complete.

# Summary

Design principles §2 and §9 fix heading sizes, label tracking, body size and line height, but components had no named text styles, only ad-hoc classes. This PR adds a named typography scale as Tailwind utilities, a script-font role reserved for the couple's names, and a specimen of every style on `/dev/theme` in every theme.

# Changes

- **`src/app/globals.css`**: nine `@utility` text styles, plus `--font-script`, which falls back to the display font:

  | Style                          | Use                      | Size                                |
  | ------------------------------ | ------------------------ | ----------------------------------- |
  | `type-script`                  | Couple's names only      | 40–72px fluid                       |
  | `type-display`                 | Hero line                | 40–72px fluid, -0.02em              |
  | `type-heading`                 | Page/section headings    | 32px at 375 → 48px at 1280, -0.01em |
  | `type-subheading`              | Card titles              | 22–28px                             |
  | `type-label`                   | Small caps labels        | 13px, uppercase, 0.12em             |
  | `type-body-lg` / `type-body`   | Lead / running text      | 18px / 16px, line-height 1.6        |
  | `type-staff-id` / `type-staff` | Staff identifiers / text | 36px / 18px                         |

- **`src/modules/theming/lib/typography.ts`** (new): the list of styles, their intended uses and sample text. It drives the specimen and the tests.
- **Schema:** optional `fonts.script` from the curated font list. `--t-font-script` is emitted only when set.
- **`theme.schema.json`:** rebuilt only by `pnpm themes:schema` under your standing approval for theme-schema writes; the approval file was deleted after the commit.
- **`/dev/theme`:** a Typography section per theme showing each style with its class name and use.
- **Tests:**
  - `src/modules/theming/__tests__/typography.test.ts` (new): parses `globals.css` and checks each style. Headings evaluate to at least 32px at 375px and at least 48px at 1280px; body is at least 16px with line height 1.5–1.7; labels use 0.08–0.15em tracking; staff text is at least 18px and identifiers at least 32px. It also covers script-role fallback and schema validation.
  - `e2e/typography.spec.ts` (new, `@smoke`): computed styles at 375 and 1280px in both themes, plus a Layout Instability observer asserting CLS is 0 on load.
- **Integration:** merged `develop` 36fdf31 (TICKET-193). No conflicts.

# Acceptance criteria and evidence

- [x] **Headings are at least 32px at 375px and 48px at 1280px; body is at least 16px with line height 1.5–1.7; labels use 0.08–0.15em tracking.** Unit tests on the CSS, plus browser-computed sizes at both widths in both themes, on mobile and desktop projects.
- [x] **`/dev/theme` shows every text style in every theme.** A specimen per theme; screenshots inspected.
- [ ] **Lighthouse reports CLS 0 on `/dev/theme`.** **Not done**: Lighthouse can't run here (see the top note). Substitute evidence: the e2e Layout Instability observer gives CLS = **0** on mobile and desktop. Fonts use `next/font` with automatic fallback metrics.

# Verification

- New unit tests failed first, then passed: 47 theming tests.
- Browser tests: `e2e/typography.spec.ts` 6 of 6 on mobile and desktop.
- `pnpm verify` after integrating `develop` 36fdf31: passed. 193 tickets valid, 219 unit tests (24 files), production build, 50 browser tests.
- Screenshots `SCREENSHOT_ROUTES=/dev/theme pnpm screenshots`: 6 passed. I inspected `artifacts/screenshots/ivory-gold/375/dev_theme.part-3.png`, which shows the full specimen.
- **Not verified:** Lighthouse, as above.

# Risks and rollout

- Additive only: no existing component switched to the new styles yet, so nothing visible changes outside `/dev/theme`. Feature tickets will adopt the styles.
- An actual script typeface is deliberately not loaded (every page would preload it). The couple's theme can set `fonts.script` once a curated script font is chosen.
- Rollback: revert the PR.

# Screenshots

| Width      | Ivory & Gold                                                                       | Midnight & Champagne |
| ---------- | ---------------------------------------------------------------------------------- | -------------------- |
| 375        | Specimen from Script and Display down to Staff text; uppercase labels; no overflow | Same in dark         |
| 768 / 1280 | Larger fluid headings; prose limited to 65ch                                       | Same                 |

Regenerate locally: `SCREENSHOT_ROUTES=/dev/theme pnpm screenshots`.

# UI checklist

- [x] **Screenshots:** `/dev/theme` at 375, 768 and 1280px in both themes; 375 inspected.
- [x] **Tokens:** Fonts come only from theme font variables; no literal font families in components.
- [x] **Restraint and typography:** The scale encodes the design rules (sizes, tracking, line height, 65ch prose in the specimen).
- [x] **Mobile:** No overflow at 375px (overflow smoke passes); headings wrap.
- [x] **Motion:** N/A.
- [x] **Keyboard:** N/A. Static text.
- [x] **Contrast:** Unchanged colours; axe stays clean on `/dev/theme`.
- [ ] **Load and images:** The e2e measurement gives CLS 0. The **Lighthouse** confirmation is not verified (blocked).
- [ ] **Performance:** Lighthouse is not run (blocked). No new fonts are loaded.
- [x] **Copy:** Samples use PRD wording.
- [x] **Shared components:** Styles live in the theme layer and are demonstrated on `/dev/theme`.
- [x] **Sharing and devices:** N/A.
- [x] **QR codes:** N/A.
- [x] **Staff feedback:** Staff styles are 18px and 36px, browser-verified in both themes.
- [x] **Verification:** `pnpm verify` passed.

# Harness changes, if any

- None. Lighthouse availability is the open decision (owner).
