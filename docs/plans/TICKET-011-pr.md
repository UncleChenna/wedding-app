# Ticket

Ticket: TICKET-011

# Summary

The PRD's theme file (THM-1) includes a `pattern` texture and uses simpler colour names (`text`, `muted`, `onPrimary`). Our themes had no pattern support and no documented mapping.

This PR adds an **optional, off-by-default** paper texture:

- It renders only behind guest pages, and is painted in the theme's own foreground colour through a CSS mask, so it can never add colours.
- Its strength is capped so it can't erode text contrast.
- `docs/theming.md` gains the PRD-to-token mapping and guidance on scale, placement and strength.

Ivory & Gold ships a barely visible grain. Midnight & Champagne stays plain, which also proves the no-pattern path.

# Changes

- **Schema** (`src/modules/theming/lib/schema.ts`): new optional `pattern`:

  | Field      | Rule                                                                                                                                                                 |
  | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `src`      | An SVG at `/themes/<this theme's id>/<name>.svg`, enforced by a regex plus a whole-object check, so no external URLs, other themes' folders, path escapes or rasters |
  | `strength` | 0.02–0.12                                                                                                                                                            |
  | `size`     | 64–512px                                                                                                                                                             |

- **CSS variables** (`lib/css-vars.ts`): `--t-pattern-image`, `--t-pattern-opacity` and `--t-pattern-size`, emitted only when a pattern exists.
- **Rendering:**
  - `src/app/globals.css` adds a `.theme-pattern` layer: fixed, `z-index: -1`, no pointer events, a `foreground` fill masked by the SVG, and opacity falling back to 0.
  - `src/modules/theming/components/theme-pattern.tsx` renders it with `aria-hidden`, or nothing when the theme has no pattern.
  - It's mounted only in `src/app/(guest)/layout.tsx`.
- **Themes:**
  - `public/themes/ivory-gold/paper.svg`: a 5.8KB deterministic grain of specks and fibres.
  - `ivory-gold.json` gets `pattern` (strength 0.05, size 240px).
  - Midnight & Champagne is unchanged (plain).
- **Generated:** `src/modules/theming/themes/theme.schema.json`, rebuilt only by `pnpm themes:schema` under your standing approval for theme-schema writes in this run. The approval file was deleted after the commit.
- **Docs** (`docs/theming.md`): a "PRD theme names" table mapping each PRD field to ours (`text` → `foreground`, `muted` → `muted-foreground`, `onPrimary` → `primary-foreground`, `radius` → `radii.md`, and so on). A "Paper pattern" section covers the asset rules, recommended strength (0.04–0.06), tile size, placement and opting out.
- **Fixes found along the way:**
  - `e2e/visual/screenshots.spec.ts` overlaid a theme's variables without clearing the active theme's, so Ivory's grain leaked into Midnight screenshots. It now removes existing `--t-*` variables first.
  - TICKET-010's hue test copied Ivory under a new id. It now drops the inherited pattern, which the new own-folder rule would otherwise reject.
- **Tests:**
  - `src/modules/theming/__tests__/pattern.test.ts` covers optional patterns, accepted patterns and CSS output, seven rejection cases, every pattern file existing in `public/`, and that at least one shipped theme is patterned and one plain.
  - `e2e/theme-pattern.spec.ts` (new, `@smoke`) checks the guest-page layer's computed mask URL, opacity, z-index, pointer events and `aria-hidden`, that the asset is served, and that `/checkin`, `/kitchen` and `/admin` stay plain.
- **Integration:** merged `develop` 5725c80 (TICKET-105, 191 and 192). No conflicts.

# Acceptance criteria and evidence

- [x] **A theme with a pattern renders it on guest pages; one without renders a plain background.** Browser test on `/` checks the active patterned theme. The unit test covers the no-variables path, and `ThemePattern` returns `null` without a pattern. Screenshots: Ivory shows faint grain; Midnight is plain.
- [x] **`docs/theming.md` contains the PRD-to-token mapping table.** See the "PRD theme names" section.
- [x] **`theme.schema.json` is regenerated, not hand-edited.** Produced by `pnpm themes:schema`, and the existing freshness test passes.
- [x] **Pattern is optional and off by default; scale, placement and strength are documented; one canonical schema with explicit PRD-name mappings.** Covered by the schema and docs above.
- **Audit verification:** a missing pattern produces no texture (unit and browser), and invalid paths and out-of-range strength or size fail (7 unit cases).

# Verification

- New unit tests failed before the change; 39 theming tests pass now.
- Browser: `e2e/theme-pattern.spec.ts` 2 of 2, plus a11y 5 of 5, on mobile.
- `pnpm verify` after integrating `develop` 5725c80: passed. 192 tickets valid, format, lint, typecheck, 208 unit tests (23 files), production build, 44 browser tests.
- Screenshots `SCREENSHOT_ROUTES=/ pnpm screenshots`, inspected:
  - `artifacts/screenshots/ivory-gold/375/home.png`: faint grain, crisp text;
  - `artifacts/screenshots/midnight-champagne/375/home.png`: plain, after the harness fix.
- **Not verified:**
  - Lighthouse on the real invitation page, which doesn't exist yet (TICKET-129).
  - Real-device rendering of CSS masks in older WebKit; `-webkit-mask-*` prefixes are included.

# Risks and rollout

- The grain applies to every guest page in Ivory & Gold at 5% opacity. To turn it off, delete `pattern` from `ivory-gold.json`.
- **Contrast:** the cap is 12%. The grain is a sparse foreground-coloured mask over the background, and axe stays clean on `/dev/theme`. Guest-page Lighthouse comes later.
- **Rollback:** revert the PR. Themes without `pattern` are unaffected.

# Screenshots

| Route      | Ivory & Gold                                                               | Midnight & Champagne |
| ---------- | -------------------------------------------------------------------------- | -------------------- |
| `/` at 375 | Barely visible paper grain behind "We're getting married"; text unaffected | Plain background     |

Regenerate locally: `SCREENSHOT_ROUTES=/ pnpm screenshots`.

# UI checklist

- [x] **Screenshots:** `/` at 375, 768 and 1280px in both themes; 375 inspected.
- [x] **Tokens:** The texture uses the `foreground` token via a mask. The SVG's own fill is never shown, and there are no literal colours in components.
- [x] **Restraint and typography:** A theme-level texture, optional and documented as "felt, not seen"; not per component.
- [x] **Mobile:** The fixed layer doesn't scroll horizontally or block taps (`pointer-events: none`, browser-tested).
- [x] **Motion:** N/A. Static.
- [x] **Keyboard:** N/A. The layer is `aria-hidden` and not focusable.
- [x] **Contrast:** Strength is capped at 0.12; text over the grain stays crisp in screenshots; meaning is unaffected.
- [x] **Load and images:** No layout shift (fixed, out of flow). The 5.8KB SVG is used as a CSS mask, not content, so `next/image` doesn't apply.
- [x] **Performance:** One small SVG on guest pages only. Lighthouse comes later (TICKET-129).
- [x] **Copy:** N/A.
- [x] **Shared components:** `ThemePattern` lives in theming and is used once, in the guest layout.
- [x] **Sharing and devices:** N/A for OG. Real-device mask rendering is not verified (noted).
- [x] **QR codes:** N/A.
- [x] **Staff feedback:** Staff screens stay plain (browser-tested).
- [x] **Verification:** `pnpm verify` passed.

# Harness changes, if any

- The screenshot harness clears `--t-*` variables before applying a theme.
- The regenerated theme schema is listed above.
