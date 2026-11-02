# Ticket

TICKET-044 — follow-up review evidence for the signed guest pass.

# Summary

The human merged the pass implementation in PR #73 at develop2f066ebbb175c4b8d42b0ab6f54545134f52f592 while final review was underway. This follow-up preserves the completed tests, screenshots, performance evidence and physical-device release gate. It changes no product implementation.

# Changes

- Add keyboard anchor/focus and long-name overflow checks to the isolated signed-pass journey.
- Add a separate missing-signing-key review mode: saved replies remain intact, safe copy appears, and no fake QR or pass link is offered.
- Preserve all24 inspected screenshots and three raw production mobile Lighthouse reports.
- Record functional acceptance and explicitly retain physical QR/WhatsApp tests in TICKET-201, which blocks both guest releases.

# Acceptance criteria and evidence

Rendered signed SVG decoding, four-module quiet zone and at least4.5:1 contrast pass in every theme. Live tests prove accepted-only display, immediate yes/no updates, return access without envelope replay, reduced motion, keyboard navigation and revocation. All24 screenshots were inspected, including long-page slices and visible focus. Preview approval uses the owner's existing device-QA exception; no physical result is claimed.

# Verification

Final pnpm t:pr gate on4b4ef6a passed formatting, lint, types, build,656 unit tests and697 browser smoke tests.27 unit and147 browser skips are not certified. The CLI moved the ticket to in_review and linked this PR.

Normal isolated live suite:4 passed, including signed-pass matrix, no-JavaScript RSVP, tampering and revocation. Missing-key mode:4 passed,1 mode-specific skip; the skipped signed-key scenario passed separately.

Production mobile Lighthouse: Performance99/100/100, Accessibility100/100/100, CLS0/0/0. Measurement used an accepted synthetic invitation with a real QR and ephemeral signing key. Its fixture and own server were cleaned afterward.

# Risks and rollout

No product code, dependency, migration or RLS change in this follow-up. Physical iOS/Android scans from screens and printouts under normal light, low light and glare, plus WhatsApp navigation/safe areas, remain mandatory release gates in TICKET-201. Lighthouse results do not certify every device or font-loading condition. Revert this follow-up to undo evidence/test additions; do not remove release requirements without replacement.

# Screenshots

docs/reviews/TICKET-044/: pass section and full invitation in four themes at375/768/1280. All24 inspected. Only synthetic guests and expired test fixtures appear.

# UI checklist

Detailed results: docs/reviews/TICKET-044/REVIEW.md. Automated accessibility, responsiveness, contrast, copy, reduced motion, keyboard, measured performance and measured CLS pass. Physical device checks remain not verified. Approved for preview only, not guest release.

# Harness changes, if any

Ticket-specific review script adds a missing-key mode. Shared harness unchanged.
