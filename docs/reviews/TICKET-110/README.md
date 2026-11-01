# TICKET-110 UI review — 2026-11-01

Implementation d7cec74; base develop c9edef6cb137a194f9c215fc5b61b08488a54aa0.
Draft PR: https://github.com/UncleChenna/wedding-app/pull/66

**CHANGES REQUESTED:** local full verification and CI are not green. Physical iPhone installation and WhatsApp are not verified.

| Check             | Result and evidence                                                                                                                                                                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots       | PASS for the guide: all12 final images reviewed at375/768/1280 across four themes, under THEME/WIDTH/guide.png. Repository route matrix also ran for /checkin,/kitchen,/dev/theme; its unrelated full showcase slices are not individually certified here. |
| Tokens            | PASS: existing theme classes, shared Button/Sheet, currentColor SVG illustrations. No new theme token or literal color/font.                                                                                                                               |
| Restraint / type  | PASS: one optional trigger, three steps,18px body and controls, restrained background/text/accent.                                                                                                                                                         |
| Mobile            | PASS emulated widths: no horizontal overflow,44px targets, bottom sheet at375 and centered at wider widths. Scrollable90dvh bound and shared safe-area padding. Physical keyboard/safe-area behavior unverified.                                           |
| Motion            | PASS: reduced-motion browser runs; no new entrance animation or blocked action.                                                                                                                                                                            |
| Keyboard          | PASS guide cases: Enter opens, focus enters Close, Tab/Shift+Tab stay in sheet, Escape and Got it return focus, reopening works. Other invitation focus failures remain unresolved below.                                                                  |
| Contrast          | PASS: axe WCAG A/AA reports no violations for guide in all themes and widths.                                                                                                                                                                              |
| Load / images     | No photos or QR output changed. Trigger space reserved before client detection. Page-level CLS release verification remains unverified for this ticket; hosted envelope gate failed.                                                                       |
| Performance       | NOT VERIFIED: no live guest pass exists yet to certify this guide within a completed pass journey. Existing guest performance release gate remains mandatory in TICKET-201; no95+ claim.                                                                   |
| Copy              | PASS automated review: warm utility text, Safari-first advice, no offline promise or forced link copy. Apple guidance referenced in the dated plan; toolbar position not hardcoded. Real WhatsApp instructions remain manual/unverified.                   |
| Shared components | PASS: existing Sheet/Button; pattern mounted in /dev/theme. No changes to shared Sheet internals.                                                                                                                                                          |
| Sharing / devices | NOT VERIFIED: no physical iPhone/WhatsApp or actual Safari-engine installation performed. Chromium UA fixtures are not real-device evidence.                                                                                                               |
| QR                | N/A: code, frame and pass payload untouched.                                                                                                                                                                                                               |
| Staff feedback    | PASS added text/control size18px; modal opens on explicit request. No scan/status changes.                                                                                                                                                                 |
| Verification      | FAIL full gates; see actual results below.                                                                                                                                                                                                                 |

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
