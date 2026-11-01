# Ticket

TICKET-210 — Eliminate invitation font-swap shifts after integration.

# Summary

Font swaps moved the centred couple names and headline even when their block bounds stayed unchanged. Neighbouring preview links also shifted as glyph widths changed. Text now keeps stable left origins in centred columns, and preview links reserve their own width.

# Changes

- Retain fonts, fluid sizes, wrapping, colours, Warm wording and envelope motion.
- Add delayed-font regressions across four themes and 375/768/1280, asserting stable name/headline/link origins and exact zero CLS.
- Expand first-visit, replay, return and keyboard coverage to all three widths.
- Publish controlled measurements, twelve reviewed screenshots and performance evidence.
- Include only the unchanged TICKET-209 definition for contiguous-ID validation under the approved exception; no TICKET-209 implementation is included.

# Acceptance criteria and evidence

1. Baseline develop c9edef6cb137a194f9c215fc5b61b08488a54aa0 and TICKET-104 match in all twelve controlled font-delay comparisons. Baseline CI41279198910 reproduces the exact original Adaora failure, including retries.
2. Name-origin regression: twelve failures before correction. Expanded tests exposed a second headline shift in CI41280253622; four local headline-origin failures were captured before correcting it.
3. The final focused matrix passes all 78 checks across mobile/desktop, four themes and three widths.
4. Full local verification and Linux CI41281345380 pass on implementation head f6c22c06c5808fb8371a34bd1871378f364447a5. Failed runs and remaining device limits are retained. Required checks will be rechecked on the final PR head before merge.

# Verification

- Full local and Linux gates: 514 unit tests passed / 26 skipped; 615 browser tests passed / 135 skipped.
- Focused browser matrix: 78 passed.
- Standard screenshot matrix: 24 passed.
- Three final serial production Lighthouse runs on /dev/invitation/letter: Performance 96/97/96, Accessibility 100/100/100, CLS 0/0/0.
- One Lighthouse NO_NAVSTART trace-collection error is preserved separately. Earlier candidate scores are historical, not substituted.
- No assertion, threshold, timeout, retry or hook was weakened.

# Risks and rollout

Physical iOS/Android and WhatsApp checks remain unverified under release-blocking TICKET-201. Its approved preview-delivery exception does not certify production guest readiness.

No migration, dependency, service or data changes. Revert the layout/regression changes to roll back. PRs #64, #65 and #66 need the fix integrated and their own gates rechecked.

# Screenshots

[All twelve reviewed images](https://github.com/UncleChenna/wedding-app/tree/TICKET-210/docs/reviews/TICKET-210/images) cover every theme at 375/768/1280.

Review /dev/invitation/letter?theme=ivory-gold and the other themes. Throttle fonts, replay the envelope, navigate to the reply section using the keyboard and enable reduced motion.

# UI checklist

[Complete results](https://github.com/UncleChenna/wedding-app/blob/TICKET-210/docs/reviews/TICKET-210/README.md): local/Linux layout, typography, tokens, contrast, motion, keyboard, zero-CLS and performance checks pass. Physical sharing/device checks remain explicitly unverified under TICKET-201; QR and staff feedback are unchanged and N/A.

# Harness changes, if any

No harness behavior changes. Regression coverage preserves the strict zero-CLS requirement.
