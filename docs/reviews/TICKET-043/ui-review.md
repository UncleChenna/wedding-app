# TICKET-043 UI review

2026-11-09 final review against develop `37e9202c`: **APPROVE for review with
explicit release gates retained** under the owner's standing preview exception.
Full verification passes: 1,157 unit tests / 121 skipped, build, and 863 browser
tests / 189 skipped. Authenticated mobile/desktop journeys pass 2/2 (6.8 seconds),
including the new successful-revoke focus regression. The independent reviewer
found no remaining blocker in the scoped focus fix.

The prior screenshot matrix remains visually applicable: the focus fix changes
no styling/layout; the actual ivory/gold 375px confirmation was reinspected.
Full-gate tests reran the all-theme contrast, reduced-motion, keyboard and CLS
checks. Physical phones, WhatsApp and safe areas remain unverified release gates.
The table records the existing visual matrix plus current regression evidence.

| Checklist item           | Result and evidence                                                                                                                                                                                                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Screenshots              | PASS: all 48 captures inspected: /dev/share and authenticated /admin/sharing, four themes × 375/768/1280 × revoke/reissue. Files are in screenshots/; admin- names identify authenticated captures. Long synthetic household names wrap; warnings, actions and focus outlines remain visible.                                              |
| Tokens                   | PASS: lifecycle controls use shared Button/Sheet and semantic utility classes; no literal colours, font families, radii or shadows added.                                                                                                                                                                                                  |
| Restraint and typography | PASS for inspected controls: one confirmation action with cancellation, display heading, 18px body/control text, relaxed leading, wrapping household identity and restrained semantic danger styling.                                                                                                                                      |
| Mobile                   | PASS for browser coverage: both authenticated dialogs pass no-overflow and 44px button checks in all four themes at 375/540/768/1024/1280. Mobile sheets place actions at the bottom and shared Sheet reserves safe-area padding. Physical safe-area handling is not verified. No editable fields or virtual keyboard are introduced.      |
| Motion                   | PASS: all 12 theme/width confirmation tests run with reduced motion. No new animation or blocking transition is introduced.                                                                                                                                                                                                                |
| Keyboard                 | PASS: successful revoke now focuses the surviving Reissue action (authenticated mobile/desktop regression); keyboard opening, Shift+Tab/Tab wrap, Escape dismissal and trigger focus return pass for both authenticated dialogs in all four themes at five widths. Authenticated cancellation is non-mutating.                             |
| Contrast                 | PASS: rendered revoke and reissue states pass axe WCAG A/AA through 2.2 in all four themes at all three widths. Actions and warnings have text labels, not colour-only meaning.                                                                                                                                                            |
| Load and images          | PASS within measured scope: default-theme /dev/share CLS=0 at 375/768/1280. Authenticated /admin/sharing CLS=0 in mobile and desktop projects after fonts and network settle (2/2 tests, 7.1s). This is not cold-font coverage for every theme. No image or font implementation changed; existing local next/font registry remains in use. |
| Performance              | N/A to new UI: only administrator controls and a local development preview changed; no guest page rendering or assets changed. This does not waive existing guest Lighthouse release gates.                                                                                                                                                |
| Copy                     | PASS: confirms consequences, preserves saved replies, and explicitly warns that disconnected scanners may accept old passes until refresh. Expected errors use safe action messages.                                                                                                                                                       |
| Shared components        | PASS: existing Button and Sheet compose feature-specific controls. No new generic UI primitive or theme token introduced.                                                                                                                                                                                                                  |
| Sharing and devices      | NOT VERIFIED: reissued and revoked links are exercised by real browser HTTP requests, but opening the replacement invitation in physical iOS/Android WhatsApp browsers has not been tested. No Open Graph implementation changed.                                                                                                          |
| QR codes                 | N/A to rendering: this feature changes credential/version validity, not QR pixels, framing or quiet zone. Snapshot contract tests do not certify physical scanning or the future offline scanner implementation.                                                                                                                           |
| Staff feedback           | PASS for admin controls: pending text and aria-busy, result status text, 18px controls and semantic danger variant. Scan sound/haptics are N/A because no scanner UI is implemented here.                                                                                                                                                  |
| Verification             | PASS on current integration: full verify, 1,157 unit passes/121 skips, build, 863 browser passes/189 skips. Separate authenticated lifecycle/focus suite 2/2 passes.                                                                                                                                                                       |

## Remaining actions

1. Preserve physical-device release requirements; the owner authorized preview progress without claiming those checks passed.
2. Advance through the CLI and require passing final-head CI and independent review before merge.

The offline scanner download and actual stale-snapshot refresh journey remain in
TICKET-065. This review neither implements nor certifies that dependent work.
