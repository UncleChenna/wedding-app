# Ticket

TICKET-015 — Define the typography scale and font roles.

# Summary

The design rules previously required ad hoc text classes. Nine named typography utilities now encode display, heading, label, body and staff roles, with a specimen in every registered theme. The optional couple-name script role falls back to the current theme's display font. Lighthouse confirms zero layout shift on /dev/theme.

# Changes

- Add type-script, type-display, type-heading, type-subheading, type-label, type-body-lg, type-body, type-staff-id and type-staff utilities with documented uses and responsive sizing.
- Support optional fonts.script from the curated font list; the original schema update was generator-produced. No new font is loaded.
- Reset the optional script role per theme and use scoped font variables in named utilities, preventing outer-theme font inheritance in nested previews.
- Demonstrate all styles in /dev/theme, including Uchenna & Adaora; document the theme contract.
- Add CSS contract and browser-computed sizing, font-role and zero-layout-shift checks, plus screenshot and Lighthouse evidence.

# Acceptance criteria and evidence

All three criteria are met. Browser checks confirm headings ≥32px at 375 and ≥48px at 1280, body ≥16px and 1.5–1.7 line-height, and label tracking within 0.08–0.15em. Every style is shown in both themes. Lighthouse 13.5.0 reports CLS exactly 0 on /dev/theme in mobile and desktop modes. See docs/reviews/TICKET-015/README.md, its audit extracts and six specimen screenshots.

# Verification

47 focused theming unit tests and the rendered font regression pass. Quick/full gate: 259 unit tests; 162 browser passes, one invitation test passing on retry and 17 conditional skips. The invitation timeout also passed in isolation with retries disabled (16.6s). Repository screenshot suite: six passed. Lighthouse: mobile Performance 85 / Accessibility 100 / CLS 0; desktop 100 / 100 / 0. PR workflow repeats full verification.

# Risks and rollout

The named styles are additive and currently demonstrated in the component catalog; feature pages adopt them in later tickets. No new font download, production data, migration or account setup is added. Current theme defaults remain unchanged. Mobile showcase performance is 85, not a guest-release performance certification; remaining real-device and release QA stays in TICKET-201 under the user's preview approval. Revert this ticket to roll back the utilities and optional role.

# Screenshots

Six detailed typography specimens in docs/reviews/TICKET-015/screenshots/ cover both themes at 375/768/1280. Open /dev/theme and compare names, heading wrapping, body text and staff roles. The dark theme must retain Playfair/Jost rather than inherit the outer ivory fonts.

# UI checklist

Per-item results and limitations: docs/reviews/TICKET-015/README.md. The required Lighthouse CLS result is now recorded; physical guest-device QA is not claimed.

# Harness changes, if any

None. Existing verification gates and assertions are retained; new regression coverage catches nested-theme font leakage. Merge after required CI passes under the user's explicit authorization.
