# TICKET-210 review — 1 November 2026

CHANGES REQUESTED: full verification, hosted CI and performance pending.

## Evidence

Baseline develop c9edef6cb137a194f9c215fc5b61b08488a54aa0; baseline draft PR67 head5857b5750a48584392892bce2df7d3fc115b94f9 has no runtime/test changes. CI41279198910 remains running.

Held WOFF2 requests until fallback paint, measured text ranges, released fonts and recorded resource timing/layout-shift entries. Compared baseline (29070) and existing TICKET-104 build (20590) in four themes at375/768/1280. All twelve pairs have identical results; see [raw data](font-comparison.json).

Playfair Adaora moved horizontally1.484375px /1.953125px /2.546875px at the three widths while its block stayed stationary. Equal vertical font metrics do not imply equal string widths. This Mac did not emit name shift entries for those small movements; do not claim the Linux failure was reproduced locally. Both builds did emit preview-link shifts at768/1280: CLS0.00009266573431069959 /0.00003909335666232639. Linux baseline CI remains needed to confirm the exact earlier Adaora failure.

An initial diagnostic matcher was incorrectly escaped and did not delay fonts. That uncontrolled output is retained locally and excluded from the delayed-font evidence. Corrected matcher: **/*.woff2.

## Candidate

Names use a stable left text origin in a centred maximum18rem column; preview links reserve14rem each. Fonts, fluid sizes, wrapping, colours, copy and motion remain intact.

Initial behavioral regression:12/12 failures before implementation. Candidate focused suite:62passed (both browser projects, replay/return/keyboard/reduced motion/delayed fonts). Final test additionally requires loading state, two painted frames, stable link origins and zero CLS; full verification running.

Logs: artifacts/TICKET-210/font-regression-red.log, focused-green.log, verify.log.

## UI checklist

| Check                | Result                                                                        |
| -------------------- | ----------------------------------------------------------------------------- |
| Screenshots          | PASS: all12 images in images/ visually inspected, four themes at375/768/1280. |
| Tokens               | PASS: spacing/alignment utilities only.                                       |
| Restraint/typography | PASS: existing font roles and scale; left-aligned name column.                |
| Mobile               | PASS: focused overflow/tap-target assertions and captures.                    |
| Motion               | PASS: existing reduced-motion and600ms/replay checks.                         |
| Keyboard             | PASS: existing reply/replay focus checks.                                     |
| Contrast             | PASS: existing all-theme envelope axe checks.                                 |
| Load                 | Final strengthened zero-CLS matrix pending full verification.                 |
| Performance          | NOT VERIFIED for candidate yet.                                               |
| Copy                 | PASS: Warm wording unchanged.                                                 |
| Shared components    | PASS: existing components retained; none added.                               |
| Sharing/devices      | NOT VERIFIED physically; mandatory release gates retained.                    |
| QR/staff             | N/A: no changes.                                                              |
| Verification         | Pending local full gate and final-head CI.                                    |

No migration, dependency, service or data changes. Revert the layout/regression commit to roll back, restoring the measured instability.

## Confirmed baseline and local gate

Baseline CI41279198910 finished FAIL:573passed,135skipped,2failed (both dark-theme envelope tests and retries; exact Adaora CLS0.0001711703703703704). Log: artifacts/TICKET-210/baseline-ci-failed.log. This confirms merged develop already contains the same failure.

Candidate full verification session8985 finished PASS:514unit/26skip;599browser/135skip. All strengthened delayed-font assertions pass. Subsequently expanded existing first/replay/keyboard test to375/768/1280; final focused session13655 running, artifacts/TICKET-210/final-focused.log. Runtime source unchanged since full gate. Final-head CI must cover expanded matrix. Baseline CI is now terminal, so publishing no longer cancels it.
