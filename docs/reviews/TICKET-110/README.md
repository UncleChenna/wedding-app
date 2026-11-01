# TICKET-110 UI review — 2026-11-01

Implementation d7cec74; base develop c9edef6cb137a194f9c215fc5b61b08488a54aa0.
Draft PR: https://github.com/UncleChenna/wedding-app/pull/66

**APPROVE for preview delivery under the owner's existing device-QA exception.** Physical iPhone installation and WhatsApp remain NOT VERIFIED and explicitly retained in TICKET-201/114. This is not release sign-off. Current integrated results below supersede the preserved historical failures.

| Check             | Result and evidence                                                                                                                                                                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots       | PASS for the guide: all12 final images reviewed at375/768/1280 across four themes, under THEME/WIDTH/guide.png. Repository route matrix also ran for /checkin,/kitchen,/dev/theme; its unrelated full showcase slices are not individually certified here. |
| Tokens            | PASS: existing theme classes, shared Button/Sheet, currentColor SVG illustrations. No new theme token or literal color/font.                                                                                                                               |
| Restraint / type  | PASS: one optional trigger, three steps,18px body and controls, restrained background/text/accent.                                                                                                                                                         |
| Mobile            | PASS emulated widths: no horizontal overflow,44px targets, bottom sheet at375 and centered at wider widths. Scrollable90dvh bound and shared safe-area padding. Physical keyboard/safe-area behavior unverified.                                           |
| Motion            | PASS: reduced-motion browser runs; no new entrance animation or blocked action.                                                                                                                                                                            |
| Keyboard          | PASS guide cases: Enter opens, focus enters Close, Tab/Shift+Tab stay in sheet, Escape and Got it return focus, reopening works. Integrated full-suite invitation focus checks now pass; historical failures are preserved below.                          |
| Contrast          | PASS: axe WCAG A/AA reports no violations for guide in all themes and widths.                                                                                                                                                                              |
| Load / images     | No photos or QR output changed. Trigger space reserved before client detection. Integrated envelope/font CLS tests pass; completed pass performance and physical-device behavior remain release checks.                                                    |
| Performance       | NOT VERIFIED: no live guest pass exists yet to certify this guide within a completed pass journey. Existing guest performance release gate remains mandatory in TICKET-201; no95+ claim.                                                                   |
| Copy              | PASS automated review: warm utility text, Safari-first advice, no offline promise or forced link copy. Apple guidance referenced in the dated plan; toolbar position not hardcoded. Real WhatsApp instructions remain manual/unverified.                   |
| Shared components | PASS: existing Sheet/Button; pattern mounted in /dev/theme. No changes to shared Sheet internals.                                                                                                                                                          |
| Sharing / devices | NOT VERIFIED: no physical iPhone/WhatsApp or actual Safari-engine installation performed. Chromium UA fixtures are not real-device evidence.                                                                                                               |
| QR                | N/A: code, frame and pass payload untouched.                                                                                                                                                                                                               |
| Staff feedback    | PASS added text/control size18px; modal opens on explicit request. No scan/status changes.                                                                                                                                                                 |
| Verification      | PASS integrated local gate547unit/659browser; final-head CI required. Historical failures retained below.                                                                                                                                                  |

## Actual checks

-13 pure detection tests passed.

- Quick verification passed lint/types and17 related tests.
- Final production build passed.
- Guide browser suite:28 passed in8s after sleep interruption was removed; all28 also passed in the full run.
- Full local run:527 unit passed/26 skipped;597 browser passed/135 skipped/6 failed.
- Six failures were existing mobile invitation-pages keyboard-focus checks. Unchanged isolated rerun:26 passed in19.2s. This does not turn the failed full run into a pass.
- CI41270521817:602 browser passed/135 skipped/1 failed. Emerald Night envelope reported CLS0.0001711703703703704 from the Adaora span, including retry. This matches the observed class of failures on TICKET-104/109; shared baseline causality still needs controlled proof.

## Preserved diagnostics

Ignored artifacts/TICKET-110 contains verify.log, ci-failure.log, focus-recheck.log, invitation-focus-trace.zip, interrupted-review-trace.zip, browser-review.log and browser-awake.log.
The first two guide runs stalled during macOS maintenance sleep. A913665ms trace evaluation matches a915-second pmset sleep entry. Process-scoped caffeinate allowed unchanged assertions/timeouts to pass. No persistent power setting, test weakening or Sheet workaround was introduced.

## Remaining

Resolve CI and whole-suite verification. Test actual iPhone/WhatsApp installation, preserving the unchecked manual acceptance criterion. Guest pass integration/performance remains to be measured when TICKET-044 provides a real pass.

## 2026-11-01 — integrated review

Base0397748c5c9aa4707384a3ebce6ef7bf4d0907ba; integrationb1f212a, documentationb79f6b7.
Full pnpm verify PASS:547unit/26skipped,659browser/135skipped. The former envelope and invitation-focus failures pass in the complete integrated run, not only an isolated retry. Earlier failures remain documented above.

All twelve refreshed guide screenshots individually inspected at375/768/1280 in every theme: readable18px body/controls, no clipping, visible Close focus, mobile bottom sheet and centred desktop dialog. Existing guide tests verify focus trap/return, Escape/Got it, standalone hiding and Safari-first copy.
Combined controls reviewed across36 route/theme/width cases on /checkin,/kitchen,/dev/theme: synthetic Android eligibility plus an iOS UA exposes both independent controls. Keyboard order reaches Install app → Not now → Add to Home Screen; minimum44px controls, no horizontal overflow, zero axe violations. All60 resulting staff/control screenshots inspected via four full-page and four control sheets; measurements in combined-review-results.json, images THEME/WIDTH/_-combined_.png.
Synthetic coexistence intentionally tests integration; it is not evidence a physical iPhone supplies Android's native install event.

Physical iPhone/iPad/WhatsApp installation and standalone launch remain unverified in an explicit unchecked201 criterion, blocking both releases, with114 retaining the full PWA device suite. Actual pass integration and its performance remain TICKET-044/201; this preview does not certify a completed guest pass or95+ guest performance.
No component internals, assertions, timing limits or shared Sheet behavior were changed during integration.

Standard screenshot refresh72999 TERMINAL PASS:36 cases for /checkin,/kitchen,/dev/theme across all themes and375/768/1280. Combined control-specific screenshots were separately inspected as described above.
