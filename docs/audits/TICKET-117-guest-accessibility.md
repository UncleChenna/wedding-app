# Guest accessibility audit — TICKET-117

## Scope and method

Actual personal invitation, saved RSVP/party fields and issued signed pass, rendered against an owned synthetic database. Four themes (Ivory & Gold, Midnight & Champagne, Emerald Night, Blush & Sage), 320/375/768/1280 CSS-pixel widths, reduced motion, sequential keyboard navigation to RSVP, keyboard submission, and focused saved-state announcements. Separate checks enlarge the root text size to 200%; this is text resizing, not a claim of physical browser zoom or screen-reader testing.

The project’s Playwright/axe helper checks all WCAG 2.0/2.1/2.2 A/AA tags. Automated results do not establish full WCAG conformance. Table ordering is pending integration of TICKET-081’s final native renderer.

Base: `207798dc4f1535aecbf254ef3959def934d9eee2`. Reproduce with `pnpm exec tsx scripts/review-guest-accessibility.ts` using an isolated migrated database and empty event settings. The runner generates ephemeral signing keys. Synthetic guests are retired after the run; no production records are involved.

## Finding and bounded fix

**117-01 — invitation heading can overflow at narrow width with enlarged text.** At320px with200% text, “The celebration” extended the document width in all four themes. No axe violation was reported. This is a resize/reflow robustness finding related to WCAG1.4.4/1.4.10; the combined stress case exceeds the ordinary320px reflow check, so this report does not misrepresent it as an independently established serious WCAG failure.

Fix: permit emergency word wrapping on this heading using the existing `wrap-anywhere` utility. No wording, font size or text scale was reduced. The normal layout is unchanged. Before evidence: `docs/reviews/TICKET-117/baseline/`. After evidence: per-theme/width `results.json` and screenshots. All16 audit cases pass after the fix; baseline12 passed and4 failed.

## Automated evidence

- 80 rendered-state axe scans: no detected A/AA violations.
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
- Final native ordering audit after TICKET-081 merges.

No open serious issue was detected by the completed automated checks. The ticket’s full no-open-serious sign-off remains unverified until the outstanding manual work is performed. Preview merge authorization does not certify guest release readiness.
