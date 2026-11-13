# Guest accessibility audit — TICKET-117

## Scope and method

Actual personal invitation, saved RSVP/party fields and issued signed pass, rendered against an owned synthetic database. Four themes (Ivory & Gold, Midnight & Champagne, Emerald Night, Blush & Sage), 320/375/768/1280 CSS-pixel widths, reduced motion, sequential keyboard navigation to RSVP, keyboard submission, and focused saved-state announcements. Separate checks enlarge the root text size to 200%; this is text resizing, not a claim of physical browser zoom or screen-reader testing.

The project’s Playwright/axe helper checks all WCAG 2.0/2.1/2.2 A/AA tags. Automated results do not establish full WCAG conformance. The native table selection, menu and sent-order receipt are also audited after integrating the final TICKET-081 renderer.

Final integration base: `979609e67070bf022ddc0a94f5807c090203331e`. Invitation evidence includes the saved-meal fix; native ordering evidence was recorded after this integration. Reproduce with `pnpm exec tsx scripts/review-guest-accessibility.ts` using an isolated migrated database and empty event settings. The runner generates ephemeral signing keys. Synthetic guests are retired after the run; no production records are involved.

## Finding and bounded fix

**117-01 — invitation heading can overflow at narrow width with enlarged text.** At320px with200% text, “The celebration” extended the document width in all four themes. No axe violation was reported. This is a resize/reflow robustness finding related to WCAG1.4.4/1.4.10; the combined stress case exceeds the ordinary320px reflow check, so this report does not misrepresent it as an independently established serious WCAG failure.

Fix: permit emergency word wrapping on this heading using the existing `wrap-anywhere` utility. No wording, font size or text scale was reduced. The normal layout is unchanged. Before evidence: `docs/reviews/TICKET-117/baseline/`. After evidence: per-theme/width `results.json` and screenshots. All16 audit cases pass after the fix; baseline12 passed and4 failed.

**117-02 — saved meal choice is visually cleared by the native action reset.** Screenshot inspection found “Choose a meal” immediately after the saved confirmation. A real browser assertion reproduced an empty select value instead of the saved meal UUID. This creates misleading form state for keyboard and screen-reader users; automated axe rules did not detect it. Prevent the native reset on this controlled party form so the React saved/draft state remains visible. No server validation or saved values changed. A native-form-reset unit regression and all 16 real invitation cases, now asserting the saved selection, pass. Before evidence: `baseline/meal-select-reset-375.png` and `meal-select-reset.json`. This is the one bounded RSVP-journey remediation, separate from the invitation-heading fix.

## Automated evidence

- 140 rendered-state axe scans: no detected A/AA violations (80 invitation/RSVP/pass and 60 ordering states).
- 16 native-ordering cases pass across all four themes and widths. Table entry, quantity selection and order submission use real keyboard actions. Quantity, submit and receipt focus are hit-tested to ensure the fixed action bar does not cover them. The 320px ordering states also pass 200% text checks.
- All16 theme/width cases: invitation, saved RSVP, enlarged saved RSVP, issued pass, enlarged pass fit the viewport after remediation.
- RSVP is reached through sequential Tab navigation and submitted with Enter. Saved RSVP and party details move focus to their status messages.
- Every audited case uses reduced-motion media preference.
- Screenshots and exact machine-readable outcomes: `docs/reviews/TICKET-117/<theme>/<width>/`.

These checks do not assess every dialog, error path or assistive-technology announcement. Existing journey tests remain in place; this audit does not replace them.

## Outstanding release evidence

- Physical iOS VoiceOver and Android TalkBack: reading order, labels, announcements, companion addition/removal and pass saving.
- Actual browser200% zoom/reflow and software keyboard interaction on the event’s supported phones.
- WhatsApp in-app navigation/forms, real QR scanning and manual visual contrast review.
- Fresh production Lighthouse and exact-zero CLS evidence under TICKET-201.

No open serious issue was detected by the completed automated checks. The ticket’s full no-open-serious sign-off remains unverified until the outstanding manual work is performed. Preview merge authorization does not certify guest release readiness.

2026-11-13 hero integration: develop `21722cb97d525a683e0fcd85a4007bbda5db9a76` retained with the celebration heading wrapping fix. Production build and all 16 invitation/saved-RSVP/issued-pass cases pass (44.4s), refreshing all four themes at 320/375/768/1280 and 80 axe state scans with zero violations/overflow. Existing native ordering evidence remains unchanged. Initial concurrent hook run had three unchanged 5s unit timeouts; all 6 affected tests pass in 2.97s with one worker, and the complete normal integration hook passes with VITEST_MAX_WORKERS=2 and unchanged limits. Native isolated database stopped with data preserved. Manual release criteria remain in TICKET-201.
