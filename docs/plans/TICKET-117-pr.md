## Summary

Audit the actual guest invitation, saved RSVP, issued pass and native table-ordering journey. Fix a narrow-layout heading overflow and preserve the selected meal after successful RSVP saving.

## Changes

- Add an isolated synthetic-data audit runner with ephemeral signing keys.
- Exercise four themes at 320/375/768/1280px, reduced motion, real keyboard submission, status focus and enlarged text.
- Allow the celebration heading to wrap without reducing its font size.
- Prevent native action reset from clearing controlled party fields after save; add a reset regression test.
- Preserve baseline/final screenshots and JSON, with physical screen-reader/device evidence retained in release-blocking TICKET-201.

## Acceptance criteria and evidence

Audit: `docs/audits/TICKET-117-guest-accessibility.md`; evidence: `docs/reviews/TICKET-117/`.

Baseline reproduced four enlarged-text overflows and the cleared saved-meal select. After both fixes: 16 invitation/RSVP/pass cases and 16 native-ordering cases pass, with 140 rendered-state axe scans reporting zero detected A/AA violations. Ordering checks also prove keyboard focus is not obscured by the fixed action bar.

Physical VoiceOver/TalkBack, actual phone zoom/keyboards and full manual conformance sign-off remain unverified under TICKET-201. This preview does not certify release readiness or full WCAG conformance.

## Verification

- Integrated develop `979609e67070bf022ddc0a94f5807c090203331e`; production build passes.
- Invitation/RSVP/pass audit: 16/16 pass (1.1m), including saved-meal selection assertion.
- Native ordering audit with focus visibility: 16/16 pass (40.5s).
- Native controlled-form reset unit regression: 1/1 passes.
- Root text resizing tests use 200% text, not a claim of real browser zoom.
- Independent source review found no blocker; final targeted quick verification recorded in handoff.

## Risks and rollout

No schema or production-data changes. Synthetic fixtures retire guests and preserve append-only history. Rollback removes heading wrapping and the form-reset handler; the latter would restore the documented misleading cleared selection. Manual screen-reader, WhatsApp, QR, Lighthouse and CLS checks remain release gates.
