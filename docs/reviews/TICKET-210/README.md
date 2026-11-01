# TICKET-210 review — 1 November 2026

**CHANGES REQUESTED:** Linux CI is pending and physical-device checks remain unverified. Local implementation checks pass.

## Cause and baseline

The baseline is develop `c9edef6cb137a194f9c215fc5b61b08488a54aa0`. Draft PR #67 initially preserved its runtime and tests unchanged at `5857b5750a48584392892bce2df7d3fc115b94f9`.

[Baseline CI](https://github.com/UncleChenna/wedding-app/actions/runs/41279198910) failed both dark-theme envelope tests, including retries: 573 passed, 135 skipped, 2 failed. It reported Adaora with CLS 0.0001711703703703704 and unchanged enclosing block bounds. The same regression therefore already exists in merged develop.

A controlled comparison held WOFF2 requests until fallback paint, measured text ranges, released fonts, then recorded resource timing and layout-shift entries. Baseline and TICKET-104 production builds produced identical results for all 12 theme/width pairs. [Raw measurements](font-comparison.json) include both ports and all four themes at 375, 768 and 1280px.

On macOS, Playfair's Adaora text moved horizontally by 1.484375, 1.953125 and 2.546875px respectively. Equal vertical metrics do not guarantee equal string widths: centring therefore changes the text origin during a font swap. macOS did not report these small name movements as layout shifts; the Linux failure above is separate hosted evidence. Both local builds did report shifts from preview theme links at 768/1280px, with CLS 0.00009266573431069959 / 0.00003909335666232639.

The first diagnostic run had an incorrectly escaped route matcher and did not delay fonts. Its uncontrolled output is retained locally and excluded from delayed-font evidence. The corrected matcher is `**/*.woff2`.

## Fix

Names now have a stable left text origin within a centred column no wider than 18rem. Preview theme links reserve 14rem each. Fonts, fluid sizes, wrapping, colours, copy and envelope motion are unchanged.

The initial behavioral regression failed all 12 cases before implementation. After the fix, the first focused suite passed 62 checks. The final test additionally requires actual font-loading state, two painted frames, stable name/link origins and exact zero CLS. Existing first-visit/replay/return/keyboard assertions now run at all three widths.

## Verification

- Full local gate: **PASS**, 514 unit tests / 26 skipped; 599 browser tests / 135 skipped.
- Expanded final browser matrix: **PASS**, 78 checks across both browser projects.
- Quick verification: **PASS** for lint and types; no uncommitted source files remained for related-unit selection. The full unit suite result above is the unit evidence.
- Standard screenshot command: **PASS**, 24 route/theme/width cases for the invitation and theme showcase. The 12 affected invitation captures in [images](images/) were visually inspected.
- Three serial production Lighthouse runs on `/dev/invitation/letter`: performance **99/100/100**, accessibility **100/100/100**, CLS **0/0/0**.
- Candidate Linux CI: pending on implementation commit `fed18ea`.

Local logs and raw Lighthouse reports are under `artifacts/TICKET-210/`: `font-regression-red.log`, `focused-green.log`, `final-focused.log`, `verify.log`, `verify-quick.log`, `screenshots.log`, `performance.log`, and `baseline-ci-failed.log`.

## UI checklist

| Check                    | Result and evidence                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| Screenshots              | PASS: 12 affected-route images inspected, all themes at 375/768/1280. Standard matrix: 24 passed.   |
| Tokens                   | PASS: spacing/alignment utilities only; no hard-coded colours, fonts, radii or shadows.             |
| Restraint and typography | PASS: existing display fonts and scale; a deliberate left-aligned name column.                      |
| Mobile                   | PASS: overflow/tap-target assertions and reviewed captures.                                         |
| Motion                   | PASS: existing reduced-motion, 600ms envelope and replay checks.                                    |
| Keyboard                 | PASS: existing reply/replay focus checks at all three widths.                                       |
| Contrast                 | PASS: all-theme envelope axe checks; colours unchanged.                                             |
| Load and images          | PASS locally: final delayed-font matrix asserts exact zero CLS; no photo changes. Linux CI pending. |
| Performance              | PASS locally: three serial mobile scores 99/100/100, accessibility 100 each.                        |
| Copy                     | PASS: Warm wording unchanged.                                                                       |
| Shared components        | PASS: existing components retained; no new client boundary or shared component.                     |
| Sharing and devices      | NOT VERIFIED physically; existing release gates remain mandatory.                                   |
| QR and staff feedback    | N/A: no QR or staff behavior changed.                                                               |
| Verification             | Local full gate and expanded matrix pass; hosted final-head result pending.                         |

No migration, dependency, service or data changes. Rollback is a revert of the layout and regression commit; that restores the measured instability.

## Wider-heading regression — 1 November 2026

Candidate fed18ea CI41280253622 finished FAIL:609 passed,135 skipped,6 failed. The original Adaora failure is gone. Expanded1280px coverage identifies the centred “Two stories.” line as another moving source (dark-theme envelope tests and delayed-font checks in all four themes). Log: artifacts/TICKET-210/candidate-ci-failed.log. The new origin assertion fails all four1280px cases locally before the headline fix (headline-red.log).

The headline now has a stable left origin in a centred maximum32rem column. The delayed-font test also measures both headline lines and emits actual shift sources on failure. Build88771 passes; focused97721 passes all78 checks (headline-focused.log). All12 refreshed invitation screenshots visually inspected. Full verification, updated performance and Linux CI for this second candidate remain pending; previous successful local full/performance results apply to fed18ea only. Physical-device release gate TICKET-201 remains mandatory.
