# TICKET-210 review — 1 November 2026

**APPROVE for preview delivery.** Production guest release still requires the physical-device and sharing checks in TICKET-201 under the existing preview-delivery exception.

## Diagnosis and preserved failures

Baseline develop `c9edef6cb137a194f9c215fc5b61b08488a54aa0` was tested unchanged at `5857b57`. [Baseline CI](https://github.com/UncleChenna/wedding-app/actions/runs/41279198910) reproduced Adaora's CLS 0.0001711703703703704 in both dark themes, including retries: 573 passed, 135 skipped, 2 failed.

The [controlled font measurements](font-comparison.json) compare baseline and TICKET-104 production builds across four themes and 375/768/1280px. All twelve pairs match. WOFF2 requests were held until fallback paint, then released; text ranges, resource timing and shift sources were recorded. Names moved horizontally despite stationary block bounds. Adjacent preview links also shifted at wider widths. Matching vertical fallback metrics does not guarantee matching string widths when text is centred.

The initial name-origin regression failed all twelve cases locally. Candidate `fed18ea` fixed the original name failure, but expanded Linux coverage exposed the same issue in “Two stories.” at 1280px: [CI41280253622](https://github.com/UncleChenna/wedding-app/actions/runs/41280253622), 609 passed, 135 skipped, 6 failed. A headline-origin regression then failed all four 1280px cases locally before correction.

An initial diagnostic used an incorrectly escaped font matcher; its uncontrolled data is retained locally and excluded from evidence. Corrected matcher: `**/*.woff2`.

## Final change

Names and the two-line headline retain stable left text origins within centred columns (maximum 18rem and 32rem respectively). Preview theme links reserve 14rem each. Fonts, fluid sizing, wrapping, colours, copy and envelope motion remain unchanged.

The delayed-font regression requires actual loading state, painted fallback frames, stable name/headline/link origins and exact zero CLS. It reports actual shift sources on failure. Existing first-visit/replay/return/keyboard assertions now run at all three widths.

## Verification on f6c22c0

- **Full local gate:** 514 unit tests passed / 26 skipped; 615 browser tests passed / 135 skipped.
- **[Linux CI](https://github.com/UncleChenna/wedding-app/actions/runs/41281345380):** all jobs passed; same unit/browser counts.
- **Focused matrix:** 78 passed across mobile and desktop.
- **Standard screenshot command:** 24 cases passed for the invitation and theme showcase. All 12 affected invitation images in [images/](images/) were visually inspected.
- **Final production Lighthouse:** Performance 96/97/96, Accessibility 100/100/100, CLS 0/0/0. See [performance evidence](performance.json).
- Lighthouse initially failed to record a navigation trace (NO_NAVSTART). That error is retained separately; no numeric score was discarded. Three subsequent serial measurements succeeded.
- Earlier candidate performance was 99/100/100; those results remain historical and are not substituted for the final measurements.

Logs and raw reports are in `artifacts/TICKET-210/`: `headline-verify.log`, `headline-ci.log`, `headline-focused.log`, `headline-screenshots.log`, `headline-performance.log`, `headline-performance-retry.log`, `headline-red.log`, and both earlier failed CI logs.

## UI checklist

| Check                    | Result and evidence                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| Screenshots              | PASS: all 12 affected-route images inspected at 375/768/1280; standard matrix 24 passed.            |
| Tokens                   | PASS: spacing/alignment only; no new colours, fonts, radii or shadows.                              |
| Restraint and typography | PASS: original font roles/scale; stable left-aligned text columns.                                  |
| Mobile                   | PASS: overflow, tap targets and long-name assertions; reviewed captures.                            |
| Motion                   | PASS: existing reduced-motion, 600ms envelope and replay assertions.                                |
| Keyboard                 | PASS: reply/replay focus assertions at all three widths.                                            |
| Contrast                 | PASS: all-theme axe checks; colours unchanged.                                                      |
| Load and images          | PASS: exact zero CLS under delayed fonts in local and Linux tests; no photo changes.                |
| Performance              | PASS: final serial mobile scores 96/97/96, accessibility 100 each.                                  |
| Copy                     | PASS: approved Warm wording unchanged.                                                              |
| Shared components        | PASS: existing components retained; no new client boundary or shared component.                     |
| Sharing and devices      | NOT VERIFIED physically; TICKET-201 remains a mandatory guest-release gate.                         |
| QR and staff feedback    | N/A: no QR or staff behavior changes.                                                               |
| Verification             | PASS: full local gate and exact implementation-head Linux CI. Recheck required checks before merge. |

No migration, dependency, service or data changes. Rollback: revert the layout/regression changes, restoring the measured instability.
