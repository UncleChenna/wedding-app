# Ticket

TICKET-210 — Eliminate invitation font-swap shifts after integration.

# Summary

The couple's names moved horizontally when display fonts replaced fallback text. Preview theme links also shifted because neighbouring positions depended on glyph widths. Names now have a stable left text origin in a centred column, and preview links reserve their own width.

# Changes

- Retain the existing display fonts, fluid sizes, wrapping, Warm wording and envelope motion.
- Add delayed-font checks for four themes at 375/768/1280, requiring actual loading state, stable name/link origins and exact zero CLS.
- Expand existing envelope first-visit, replay, return and keyboard assertions to all three widths.
- Publish measurements and twelve reviewed screenshots under docs/reviews/TICKET-210.
- Carry only the unchanged TICKET-209 definition for contiguous-ID validation under the user's approved exception; no TICKET-209 implementation is included.

# Acceptance criteria and evidence

1. Baseline develop c9edef6cb137a194f9c215fc5b61b08488a54aa0 and the TICKET-104 production build have identical geometry and CLS in all twelve controlled theme/width comparisons. Raw measurements include font resource timing and layout-shift entries.
2. Unchanged-baseline CI41279198910 reproduced the exact Adaora CLS 0.0001711703703703704 in both dark themes, including retries. The new behavioral regression failed all twelve cases before the fix.
3. The final focused suite passes all 78 tests across mobile and desktop: all themes/widths, delayed fonts, replay, return, keyboard and reduced motion.
4. Full local verification passes. Hosted candidate verification is pending; this criterion is not yet certified.

# Verification

- Full local gate: 514 unit tests passed, 26 skipped; 599 browser tests passed, 135 skipped.
- Expanded final focused suite: 78 passed.
- Quick verification: lint/types passed; full unit evidence is above.
- Standard screenshot matrix: 24 passed for /dev/invitation/letter and /dev/theme.
- Three serial production Lighthouse runs on /dev/invitation/letter: Performance 99/100/100, Accessibility 100/100/100, CLS 0/0/0.
- Baseline Linux CI: 573 passed, 135 skipped, 2 failed. Failed evidence is retained.
- Candidate CI pending on fed18ea. No assertion, threshold, timeout, retry or hook was weakened.

# Risks and rollout

Physical iOS/Android and WhatsApp checks remain unverified under release-blocking TICKET-201. Its approved preview-delivery exception does not certify production readiness. This change is reviewable as preview work once CI passes.

No migration, dependency, account or data changes. Revert the layout/regression commit to roll back; that restores the measured instability. PRs64/65/66 need this fix integrated and their own verification before they can proceed.

# Screenshots

All four themes at 375/768/1280 are committed in [the image directory](https://github.com/UncleChenna/wedding-app/tree/TICKET-210/docs/reviews/TICKET-210/images). All twelve affected-route captures were visually inspected.

Review /dev/invitation/letter?theme=ivory-gold and the other themes. Throttle fonts, replay the envelope, use the keyboard to reach the reply section, and enable reduced motion.

# UI checklist

The complete PASS/FAIL/N/A evidence is in [the review](https://github.com/UncleChenna/wedding-app/blob/TICKET-210/docs/reviews/TICKET-210/README.md). Local layout, typography, tokens, contrast, motion, keyboard, load and performance checks pass. Physical sharing/device checks are explicitly not verified; QR and staff feedback are unchanged and N/A. Hosted verification remains pending.

# Harness changes, if any

No harness behavior changes. The regression tests and controlled comparison preserve the original strict zero-CLS requirement.

## Wider-heading regression — 1 November 2026

Candidate fed18ea CI41280253622 finished FAIL:609 passed,135 skipped,6 failed. The original Adaora failure is gone. Expanded1280px coverage identifies the centred “Two stories.” line as another moving source (dark-theme envelope tests and delayed-font checks in all four themes). Log: artifacts/TICKET-210/candidate-ci-failed.log. The new origin assertion fails all four1280px cases locally before the headline fix (headline-red.log).

The headline now has a stable left origin in a centred maximum32rem column. The delayed-font test also measures both headline lines and emits actual shift sources on failure. Build88771 passes; focused97721 passes all78 checks (headline-focused.log). All12 refreshed invitation screenshots visually inspected. Full verification, updated performance and Linux CI for this second candidate remain pending; previous successful local full/performance results apply to fed18ea only. Physical-device release gate TICKET-201 remains mandatory.
