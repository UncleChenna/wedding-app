# Ticket

Ticket: TICKET-019

# Summary

Gate staff and kitchen/bar staff read results at arm's length. The PRD needs five scan results: Valid, Already used, Invalid, Revoked and Not RSVP'd (CHK-2). The design principles fix their colours and require at least 32px identifiers, at least 18px text, and meaning that never depends on colour.

This PR adds two shared components on the TICKET-010 status tokens:

- **`StatusPanel`:** the large scan-result panel.
- **`StatusBadge`:** a compact board status.

Both are demonstrated on `/dev/theme`, tested for contrast in every theme, and size-checked in a real browser.

# Changes

- **`src/modules/shared/components/ui/status-panel.tsx`** (new):
  - **Scan result to colour mapping** (a decision, also documented in the code):

    | Result       | Colour |
    | ------------ | ------ |
    | Valid        | green  |
    | Already used | amber  |
    | Not RSVP'd   | amber  |
    | Invalid      | red    |
    | Revoked      | red    |

    Amber means "stop and check" and red means "a problem". Each of the five has its own icon (tick, repeat, clock, cross, no-entry) and text label.

  - **`StatusPanel`:**
    - a `section` landmark named by its label;
    - an icon with `role="img"` named "<label> icon";
    - an uppercase 18px label, the identifier at 36px (`text-4xl`) in the display font, and 18px detail text;
    - tinted `-subtle` panel tokens.
  - **`StatusBadge`:** a 44px-tall icon-and-text chip on the solid status token, for board cards.
  - Exports `SCAN_STATUSES`, `statusAppearance`, and types.
- **`/dev/theme`:** a "Staff status panels" block per theme showing all five results and three badges (Served, Preparing, Cancelled).
- **Tests:**
  - `src/modules/shared/__tests__/status-panel.test.tsx`: 11 unit tests covering labels and named icons for every status, distinct icons, size classes, the tone mapping, and AA contrast of the exact panel and badge token pairs in every registered theme.
  - `e2e/a11y.spec.ts`: a browser test that finds each panel by exact accessible name in both themes, checks its named icon, and checks computed font sizes (identifier at least 32px, label and detail at least 18px).
- **Also in this PR:** `tickets/TICKET-191-keep-stepper-focus-and-typed-value-when-stepping.md`, a ticket definition only. It covers the stepper issues raised as non-blocking nits in the PR #19 review, so the follow-up is tracked.
- **Integration:** merged `develop` (4a81730, TICKET-018). The only conflict was two new tests at the same spot in `e2e/a11y.spec.ts`; I kept both.

# Acceptance criteria and evidence

- [x] **Panels render text and an icon for every status; no meaning depends on colour.** Unit tests cover the text label and named `role="img"` icon for all five statuses, and confirm all five icons differ. The browser test finds each panel and icon by accessible name in both themes.
- [x] **Identifiers render at least 32px and body at least 18px.** Unit tests check the classes. The browser test measures computed sizes: identifier at least 32px, label and detail at least 18px, for all five panels in both themes.
- [x] **AA contrast in every theme (tested).** Unit tests compute contrast for the exact pairs used: `-subtle-foreground` on `-subtle` (panels) and `-foreground` on solid (badges). Every pair is at least 4.5:1 in every theme. axe reports 0 violations on `/dev/theme`.

# Verification

- New unit tests failed before the component existed; 11 pass now.
- Browser tests on mobile (375px): staff-panel sizes, controls at least 44px, Sheet focus and axe all pass.
- `pnpm verify` after integrating `develop` 4a81730: passed. 191 tickets valid, format, lint, typecheck, 178 unit tests (21 files), production build, 32 browser tests (12 skips are mobile-only checks inside the desktop project, plus existing overflow skips).
- Screenshots of `/dev/theme` at 375, 768 and 1280px in both themes, inspected. For example, `artifacts/screenshots/ivory-gold/375/dev_theme.part-3.png` shows the five panels stacked, with distinct icons and readable text.
- **Not verified:** arm's-length reading on a real phone in venue lighting (TICKET-163 rehearsal).

# Risks and rollout

- **Not RSVP'd is amber.** If the couple would rather turn these guests away, it's a one-line change to red in `APPEARANCE`.
- **Additive only:** no existing component changed. Rollback is to revert the PR.

# Screenshots

| Width      | Ivory & Gold                                                                                                             | Midnight & Champagne       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| 375        | Five stacked panels: green Valid, amber Already used and Not RSVP'd, red Invalid and Revoked; icon and label, 36px names | Same on dark tinted panels |
| 768 / 1280 | Two-column grid of panels; badges row below                                                                              | Same                       |

Regenerate locally: `SCREENSHOT_ROUTES=/dev/theme pnpm screenshots`.

# UI checklist

- [x] **Screenshots:** `/dev/theme` at 375, 768 and 1280px in both themes; inspected.
- [x] **Tokens:** Only status token classes; icons use `currentColor`.
- [x] **Restraint and typography:** One block; display font for identifiers; label tracking 0.1em uppercase.
- [x] **Mobile:** No horizontal scroll at 375px; badges are 44px tall; the tap-target sweep passes.
- [x] **Motion:** N/A. No animation.
- [x] **Keyboard:** N/A. No interactive elements; panels are landmarks named for screen-reader navigation.
- [x] **Contrast:** Token pairs tested in every theme; axe 0 violations; meaning carried by label and icon.
- [x] **Load and images:** N/A. Inline SVG only.
- [x] **Performance:** N/A. Server components only.
- [x] **Copy:** Demo copy follows the PRD gate wording ("Admitted 19:42 by Gate 1", "Not on the guest list."). Not RSVP'd and Revoked wording is provisional.
- [x] **Shared components:** New reusable components in `shared/components/ui`, shown on `/dev/theme`.
- [x] **Sharing and devices:** N/A. Staff components.
- [x] **QR codes:** N/A.
- [x] **Staff feedback:** Fixed meanings in all themes, at least 18px text and at least 32px identifiers, checked in a browser. Sound and vibration belong to TICKET-060.
- [x] **Verification:** `pnpm verify` passed.

# Harness changes, if any

- None.
