# Ticket

Ticket: TICKET-017

# Summary

Every guest, staff and admin feature will reuse Button, Card, Input, Sheet and Toast. They were unverified against the project's accessibility rules (44×44px targets, visible focus, dialog focus handling, reduced motion, never colour alone), and checking them found five real defects:

- **Small buttons and the toast dismiss button were under 44px.** Button `sm` was 36px tall and the toast dismiss was 32px.
- **The Sheet didn't trap focus.** Its comment claimed native `<dialog>` traps Tab, but Tab past the last control escaped to the browser UI.
- **The loading spinner kept spinning under reduced motion.**
- **Success and error toasts differed only by colour.**
- **No automated accessibility check existed.**

All five are fixed and covered by tests, and axe now reports zero violations on `/dev/theme` in both themes.

# Changes

- **Button** (`src/modules/shared/components/ui/button.tsx`):
  - `sm` is now 44px tall (smaller padding and text only), and every size has a 44px minimum width.
  - The loading spinner gets `motion-reduce:animate-none`. The `aria-busy` state and label still signal loading.
- **Toast** (`toast.tsx`):
  - Success and error toasts show an icon (tick or alert) plus a screen-reader label ("Success:" / "Error:").
  - Errors render in an assertive `role="alert"` region; other toasts stay in the polite `role="status"` region.
  - The dismiss button is 44px with a visible focus ring.
- **Sheet** (`sheet.tsx`): explicit Tab/Shift+Tab wrapping between the first and last focusable elements. Escape, the inert background and focus return remain native `<dialog>` behaviour, now proven by tests. The comment is corrected.
- **Card, Input:** no code change needed. They are now covered by tests: a Card has a real heading, and an Input is focusable, 44px tall and named by its label.
- **Tests:**
  - `src/modules/shared/__tests__/ui.test.tsx`: 9 new unit tests for sizes, focus, labels, the spinner, toast regions and icons, and Card/Input semantics.
  - `e2e/a11y.spec.ts` (new, `@smoke`, mobile project at 375px):
    - keyboard-only Sheet flow in every theme (opens with Enter, sits at the bottom edge, Tab never leaves it, Escape closes it, focus returns to the trigger);
    - a sweep confirming every visible button, input and link is at least 44×44px;
    - an axe scan (WCAG 2.0/2.1/2.2 A and AA) with the Sheet closed and open.
- **Dependency:** `@axe-core/playwright` 4.14.0, dev only, pure JS. Added with `pnpm add -D` under your approved exact-path lockfile write, which I deleted right after the commit.
- **Docs:** plan `docs/plans/2026-10-22-TICKET-017.md`, handoff `docs/handoffs/TICKET-017.md`, ticket notes.

# Acceptance criteria and evidence

- [x] **Each component has tests for keyboard operation and labels.**
  - Button: focusable native button with a focus ring, plus size tests.
  - Input: focusable, labelled, 44px.
  - Card: real heading.
  - Toast: labelled dismiss button operable by click, tone labels.
  - Sheet: full keyboard flow in e2e.
- [x] **Sheet traps focus, closes on Escape and restores focus to its trigger (e2e).** `e2e/a11y.spec.ts` "Sheet traps focus…" passes at 375px for both themes. It failed before the Tab-trap fix.
- [x] **axe reports no violations on /dev/theme in both themes.** `/dev/theme` renders both themes on one page; 0 violations with the Sheet closed and open.
  - The first run flagged colour contrast on the motion demo card text. It was measured mid-fade (600ms), and the colours themselves pass the theme contrast gate.
  - The scan now waits for finite animations to settle. Infinite ones like the spinner are excluded from the wait, otherwise it never settles. Nothing is excluded from the axe rules.

# Verification

- New unit tests: 7 failed before the fixes; all 42 shared-UI tests pass now.
- New e2e: Sheet trap and axe failed before the fixes; all 3 pass now.
- `pnpm verify` on base `develop` d105dbb: passed. 190 tickets valid, format, lint, typecheck, 154 unit tests (19 files), production build, 30 browser tests passed. The 10 skips are mobile-only checks inside the desktop project (by design) plus existing overflow skips.
- `SCREENSHOT_ROUTES=/dev/theme pnpm screenshots`: 6 passed. I inspected:
  - `artifacts/screenshots/ivory-gold/375/dev_theme.part-3.png` (buttons)
  - `artifacts/screenshots/ivory-gold/375/dev_theme.part-4.png` (toasts)
  - `artifacts/screenshots/midnight-champagne/1280/dev_theme.part-4.png`
- **Not verified:**
  - Real devices and screen readers (VoiceOver/TalkBack) are not tested; that's TICKET-131.
  - axe on other routes is TICKET-128.

# Risks and rollout

- **`sm` buttons grow from 36px to 44px.** Nothing uses `sm` in product pages yet (only `/dev/theme`). Future dense admin layouts must allow for it.
- **Error toasts now announce assertively.** That's intended for errors; use `default`/`success` for routine messages.
- **The Sheet's Tab trap is a small keydown handler.** If a sheet ever contains no focusable elements, Tab does nothing extra; the Close button is always present, so this can't happen today.
- **Rollback:** revert the PR. No data, schema or API changes.

# Screenshots

`/dev/theme`, both themes, at 375, 768 and 1280px:

| Area              | Ivory & Gold                                                                            | Midnight & Champagne                                     |
| ----------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Buttons (375)     | Small, Medium, Large all 44px+ tall; labels unchanged                                   | Same; 1280 row shows the three sizes aligned             |
| Toasts (375/1280) | "Checked in" with a tick icon on green; "Couldn't send order" with an alert icon on red | Icons inherit the dark text colour on light status fills |
| Sheet (375, e2e)  | Bottom sheet flush with the viewport bottom; focus stays inside                         | Same                                                     |

Regenerate locally: `SCREENSHOT_ROUTES=/dev/theme pnpm screenshots` (files in `artifacts/screenshots/<theme>/<width>/`, gitignored).

# UI checklist

- [x] **Screenshots:** `/dev/theme` at 375, 768 and 1280px in both registered themes; files above inspected.
- [x] **Tokens:** No literal colours, fonts, radii or shadows added. Icons use `currentColor`; ESLint's colour ban passes.
- [x] **Restraint and typography:** No new sections or decoration. Icons appear only where they carry meaning (toast tone).
- [x] **Mobile:** e2e sweep confirms every control on `/dev/theme` is at least 44×44px at 375px; overflow smoke passes; the Sheet keeps its safe-area bottom padding.
- [x] **Motion:** Reduced motion stops the spinner. No new animation. Only existing opacity/transform animations remain.
- [x] **Keyboard:** Sheet opens with Enter, traps Tab, closes on Escape and returns focus (e2e); all buttons and inputs are focusable with visible rings.
- [x] **Contrast:** axe finds 0 violations in both themes. Toast tone is conveyed by icon and label, not colour alone.
- [x] **Load and images:** N/A. No images; inline SVG icons are fixed size (no layout shift).
- [x] **Performance:** N/A. Not a guest page; tiny client-side changes only to existing client components.
- [x] **Copy:** No visible copy changes; screen-reader labels "Success:" and "Error:" are plain.
- [x] **Shared components:** Changes made in the shared components themselves, demonstrated on `/dev/theme`.
- [x] **Sharing and devices:** N/A. No guest flow or link preview changed; real-device checks remain TICKET-131/138.
- [x] **QR codes:** N/A. No QR output.
- [x] **Staff feedback:** Error toasts announce immediately (assertive); status meanings use the fixed tokens from TICKET-010.
- [x] **Verification:** `pnpm verify` passed (see Verification).

# Harness changes, if any

- New dev dependency `@axe-core/playwright` (approved). New `e2e/a11y.spec.ts` in the smoke suite.
