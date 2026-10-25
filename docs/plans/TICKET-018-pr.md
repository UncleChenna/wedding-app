# Ticket

Ticket: TICKET-018

# Summary

The RSVP form (attending yes/no, meal choice, dietary notes), the table order page (quantities, notes) and admin all need form controls. Only a text `Input` existed. This PR adds one consistent, accessible set built once on theme tokens:

- a `Field` wrapper for custom controls;
- `Textarea`, `Select`, `Checkbox`, `RadioGroup` and `QuantityStepper`.

Every control follows the same contract:

- an explicit label;
- hint and error text linked with `aria-describedby`;
- `aria-invalid` when there's an error, with the error announced to screen readers as it appears;
- a 44px tap target.

The quantity stepper keeps orders within limits and works fully by keyboard. All of it is on `/dev/theme`.

# Changes

- **`src/modules/shared/components/ui/field.tsx`** (new):
  - `useFieldIds` creates stable ids for the control, hint and error.
  - `FieldMessages` renders the hint and error. The error lives inside an always-present `aria-live="polite"` region, so it's announced when it appears, not only on focus.
  - `Field` is a render-prop wrapper for custom controls.
  - `controlClasses` holds the shared token-based look. It deliberately sets no width; see Risks.
- **New controls, all native elements, no new dependencies:**
  - **`Textarea`:** at least 112px tall.
  - **`Select`:** a native select (the platform picker is the most usable option on phones) with a themed chevron, 44px tall.
  - **`Checkbox`:** the whole label row is the 44px tap target.
  - **`RadioGroup`:** a fieldset whose legend names the `radiogroup`, with 44px option rows, controlled or uncontrolled. The invalid state and description sit on the group, because ARIA doesn't allow `aria-invalid` on individual radios.
  - **`QuantityStepper`** (the only client component):
    - − and + buttons, 44px, named "Decrease/Increase <label>" and disabled at the bounds;
    - arrow keys step, Home and End jump to min and max;
    - typed values clamp to [min, max] on blur;
    - works controlled or uncontrolled.
- **`Input`:** now uses the shared parts, so its errors are announced too. Same API and same look.
- **`index.ts`:** exports the new components and types.
- **`/dev/theme`:** a "Who's walking in with you?" card per theme with every control, using PRD wording, including demo error states.
- **Tests:**
  - `src/modules/shared/__tests__/form-controls.test.tsx` (new): 13 unit tests covering the full contract for each control, plus stepper bounds, keys and clamping.
  - `e2e/a11y.spec.ts`: the 375px tap-target sweep now also covers selects, textareas and checkbox/radio label rows.
  - A new smoke test checks labels, radio selection, the invalid checkbox and stepper keyboard bounds in both themes.

# Acceptance criteria and evidence

- [x] **Every control has an explicit label and an error state tested for `aria-invalid` and `aria-describedby`.** One shared assertion (`expectErrorContract`) checks `aria-invalid="true"`, the accessible description (hint and error) and the polite live region for Input, Field, Textarea, Select, Checkbox, RadioGroup (on the group) and QuantityStepper. Labels are asserted by accessible name, and a separate test confirms there's no invalid state without an error.
- [x] **QuantityStepper respects min/max and is keyboard operable.**
  - Unit tests cover the button bounds and disabling, ArrowUp/Down/Home/End, and clamping a typed 40 down to 5.
  - The browser test repeats the keyboard checks at 375px in both themes.
- [x] **All controls are ≥44px tall at 375px.** The browser sweep over every visible button, input, select, textarea, link and checkbox/radio label row on `/dev/theme` finds 0 elements under 44×44px.

# Verification

- New unit tests: all failed before the components existed. 55 shared-UI tests pass now, including the existing Input tests.
- **Bugs caught while building:**
  - The production build failed: `RadioGroup` always attached `onChange`, which Next.js rejects when rendered from a Server Component. It now attaches the handler only when `onValueChange` is given.
  - Screenshots showed the stepper's number field stretched full width. The shared `w-full` was overriding `w-20`, because `cn` is plain `clsx`. Width now lives in each control.
- `pnpm verify` on base `develop` 3c2131e: passed. 190 tickets valid, format, lint, typecheck, 167 unit tests (20 files), production build, 31 browser tests (11 skips are mobile-only checks inside the desktop project, plus existing overflow skips).
- axe (WCAG 2.0/2.1/2.2 A and AA): 0 violations on `/dev/theme` with the new controls, with the sheet closed and open.
- `SCREENSHOT_ROUTES=/dev/theme pnpm screenshots`: 6 passed. I inspected:
  - `artifacts/screenshots/ivory-gold/375/dev_theme.part-4.png`
  - `artifacts/screenshots/midnight-champagne/1280/dev_theme.part-5.png`

  These files are gitignored.

- **Not verified:**
  - Real phones and screen readers (VoiceOver/TalkBack announcing the live errors): TICKET-131.
  - WhatsApp's in-app browser: TICKET-138.

# Risks and rollout

- **Native checkboxes and radios** follow the browser's own rendering, tinted with the theme's `primary` through `accent-color`. That's robust and accessible, but not pixel-identical across browsers. A custom look can follow if the design calls for it.
- **`controlClasses` sets no width,** and future controls must add their own. This is noted in a comment, because `cn` can't resolve conflicting utilities.
- **The `Input` refactor** keeps the same props and output. Existing tests and the `/dev/theme` smoke test pass.
- **Rollback:** revert the PR. Nothing in product pages uses these controls yet.

# Screenshots

`/dev/theme` "Who's walking in with you?" card:

| Width | Ivory & Gold                                                                                                                           | Midnight & Champagne     |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| 375   | Single column: radios, select with chevron, checkboxes (one with a red error), textarea, compact steppers with + disabled at the limit | Same, light text on dark |
| 768   | Two columns                                                                                                                            | Two columns              |
| 1280  | Radios beside select; checkboxes paired; textarea beside steppers; error text readable                                                 | Same (inspected)         |

Regenerate locally: `SCREENSHOT_ROUTES=/dev/theme pnpm screenshots`.

# UI checklist

- [x] **Screenshots:** `/dev/theme` at 375, 768 and 1280px in both themes; files above inspected. A width bug found this way was fixed.
- [x] **Tokens:** Only theme token classes; icons use `currentColor`; ESLint colour ban passes.
- [x] **Restraint and typography:** One showcase card; labels at 14px medium, control text 16px, hint and error 14px; no decoration beyond the select chevron and stepper icons.
- [x] **Mobile:** 375px sweep finds 0 targets under 44×44px (including checkbox and radio rows); overflow smoke passes.
- [x] **Motion:** N/A. No animation added.
- [x] **Keyboard:** Native controls are focusable with visible rings; stepper keys tested in a browser; radios use native arrow-key navigation.
- [x] **Contrast:** axe 0 violations in both themes; errors carry text, not colour alone.
- [x] **Load and images:** N/A. No images; static layout, no shift.
- [x] **Performance:** N/A for guest pages. Only `QuantityStepper` is a client component.
- [x] **Copy:** Demo copy follows the PRD's RSVP wording ("Count me in" / "I'll be there in spirit", "Who's walking in with you?"). Error examples are short and human.
- [x] **Shared components:** New reusable controls live in `shared/components/ui` and are demonstrated on `/dev/theme`.
- [x] **Sharing and devices:** N/A. No guest page or link preview changed.
- [x] **QR codes:** N/A.
- [x] **Staff feedback:** N/A. No staff screen changed.
- [x] **Verification:** `pnpm verify` passed (see Verification).

# Harness changes, if any

- None.
