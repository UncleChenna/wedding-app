# Ticket

Ticket: TICKET-010

# Summary

Staff screens need green (valid), amber (already used) and red (invalid) with the same meaning in every theme (PRD THM-4, design principles §9). Before this change there was no amber/warning token. Nothing stopped a theme from recolouring a status, for example making "valid" blue.

After this PR:

- Every theme defines a full set of status tokens.
- The WCAG AA gate covers every status pair.
- Theme loading rejects any theme whose status colours leave their documented hue family.
- `/dev/theme` shows all three statuses with text labels in both themes.

# Changes

- **Tokens** (`src/modules/theming/lib/schema.ts`):
  - New: `warning` and `warning-foreground`.
  - New tinted variants for each status: `success-subtle`, `success-subtle-foreground`, `warning-subtle`, `warning-subtle-foreground`, `danger-subtle`, `danger-subtle-foreground`.
  - That makes 12 status tokens in all, defined in `ivory-gold.json`, `midnight-champagne.json` and the low-contrast test fixture.
- **Contrast gate** (`lib/contrast.ts`): 10 new pairs.
  - At 4.5:1: `warning-foreground` on `warning`; each `-subtle-foreground` on its `-subtle` panel and on `surface`.
  - At 3:1: each solid status colour on `surface`, as a non-text indicator.
- **Hue gate** (`lib/status.ts`, new):
  - Documented HSL ranges: green 90–170°, amber 25–60°, red 345–15° (wraps around 0°). Saturation must be at least 30%, so a status can't fade to grey.
  - Checked on each solid colour and its `-subtle-foreground`.
  - `loadTheme` throws a `ThemeValidationError` naming the token and the expected family, as it already does for contrast.
- **Schema** (`themes/theme.schema.json`): rebuilt only by `pnpm themes:schema`. It's a protected generated file; you approved the exact-path write in chat, and I recorded that approval in the worktree's ignored `.harness/approved-writes.json`, expiring today at 18:00 UTC.
- **UI:**
  - `src/app/globals.css` maps the 8 new tokens to Tailwind colours.
  - `/dev/theme` gains a Status section. Each status has a text badge (Valid / Already used / Invalid) and a message on its tinted panel, so meaning never depends on colour alone.
- **Tests:**
  - `src/modules/theming/__tests__/status-tokens.test.ts` (new) covers token presence, contrast-pair coverage, hue maths and the wrap-around, and every theme passing. It also checks that a blue "success" and a grey "warning" are rejected.
  - `e2e/smoke.spec.ts` checks each label is visible and that each panel paints its theme's exact `-subtle` colour.
- **Docs** (`docs/theming.md`): token rows, a "Fixed status meanings" table with hue ranges, and why the light theme's amber is a deep honey colour.

# Acceptance criteria and evidence

- [x] **Every theme defines the status tokens and passes AA for each status pair.** Both themes define all 12 tokens (unit test), and both pass the extended `CONTRAST_PAIRS`, because registration runs the gate at load and `pnpm verify` builds.
  - Light-theme amber is `#946000` with white text. Bright ambers can't reach 3:1 on a white card, so the tinted `#FCEFC7` panel with `#6B4500` text carries the bright amber look.
- [x] **Hues stay within a documented range (green, amber, red).** Ranges are documented in `docs/theming.md` and `STATUS_HUE_RANGES`, and enforced by `loadTheme`. A unit test asserts both themes pass and that out-of-range themes fail with the token named.
- [x] **/dev/theme shows the three statuses with text labels in both themes.** The smoke test asserts the labels and exact panel colours per theme. Screenshots are below.

# Verification

- New unit tests: failed first (module missing), then passed. All theming tests: 28 passed.
- `pnpm verify`, base `develop` 15533a1: passed. 190 tickets valid, format, lint, typecheck, 140 unit tests (18 files), production build, 27 browser tests (mobile + desktop), including the new status assertions.
- `SCREENSHOT_ROUTES=/dev/theme pnpm screenshots`: 6 passed (2 themes × 375/768/1280). I inspected:
  - `artifacts/screenshots/ivory-gold/375/dev_theme.part-2.png`
  - `artifacts/screenshots/midnight-champagne/375/dev_theme.part-6.png`
  - `artifacts/screenshots/ivory-gold/768/dev_theme.part-2.png`
  - the 1280 slice

  These files are local and gitignored.

- **Not verified:** real devices. The tokens aren't used on guest or staff pages yet; TICKET-019 builds the staff components.

# Risks and rollout

- **Any new or edited theme must now define all 12 status tokens and stay within the hue ranges,** or it fails at load and in the build. This is intended: the error message names the token and the expected colour family.
- The themes stored in the DB `themes` table hold token snapshots. The seed reads the registry, so `pnpm db:seed` picks up the new tokens. No migration is needed.
- **Rollback:** revert the PR. The previous tokens are untouched, and no existing component uses the new ones.

# Screenshots

`/dev/theme` Status section, inspected at every review width in both themes:

| Width | Ivory & Gold (light)                                                                                                 | Midnight & Champagne (dark)                                  |
| ----- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 375   | Three stacked panels: Valid (green), Already used (amber), Invalid (red), each with a badge and message, no overflow | Same layout; light text on dark tinted panels, bright badges |
| 768   | Three columns; messages wrap cleanly                                                                                 | Same                                                         |
| 1280  | Three columns under the colour token grid                                                                            | Same                                                         |

Regenerate locally: `SCREENSHOT_ROUTES=/dev/theme pnpm screenshots` (output in `artifacts/screenshots/<theme>/<width>/`).

# UI checklist

- [x] **Screenshots:** `/dev/theme` at 375, 768 and 1280px in both registered themes; files listed above and inspected.
- [x] **Tokens:** No literal colours in components; ESLint's colour ban passes. New tokens were added through the documented process (schema → every theme → `globals.css` → `pnpm themes:schema`).
- [x] **Restraint and typography:** One Status section; uses existing label style (uppercase, tracked) and 16px body text; status colours are the documented exception to the three-colour guest palette.
- [x] **Mobile:** No horizontal scroll at 375 (existing overflow smoke test passes); no new tap targets.
- [x] **Motion:** N/A. No animation added; existing motion untouched.
- [x] **Keyboard:** N/A. No interactive elements added. Badges and messages are static text.
- [x] **Contrast:** Every status pair passes AA in both themes (enforced at load). Meaning is carried by text labels, not colour alone.
- [x] **Load and images:** N/A. No images; no layout shift added (static server-rendered section).
- [x] **Performance:** N/A. `/dev/theme` is not a guest page; no client JS added (Server Component).
- [x] **Copy:** Provisional staff wording ("Valid", "Already used", "Invalid", "Welcome, Ada. Table 7 is ready for you.") follows the PRD's gate copy. It is demo text on a dev page.
- [x] **Shared components:** No new component. These are token demonstrations on `/dev/theme`; staff components are TICKET-019.
- [x] **Sharing and devices:** N/A. Dev-only route with no guest flow or link preview.
- [x] **QR codes:** N/A. No QR output changed.
- [x] **Staff feedback:** Fixed status meanings are checked in all themes (hue gate plus screenshots). Sound and vibration belong to TICKET-060.
- [x] **Verification:** `pnpm verify` passed (see Verification).

# Harness changes, if any

- None to hooks. Found, not fixed: `scripts/harness/commit-rules.mjs` flags ordinary words that merely end in its attribution phrase (for example "re-" plus that phrase) because its regex lacks a leading word boundary (`\b`). I reworded the commit message. Worth a small follow-up ticket.
