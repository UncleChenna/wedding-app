# TICKET-192 UI review

26 October 2026. Shared staff-component follow-up, demonstrated on /dev/theme. No new guest route or scanner integration.

| Checklist item       | Result and evidence                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Screenshots          | PASS: repository screenshot run passed six theme/width cases. Full-page captures and six detailed staff-section captures are in screenshots/. Overview layouts and every changed staff section reviewed at 375/768/1280. |
| Tokens               | PASS: no colour, font, radius or shadow changes. Existing ban icon reused.                                                                                                                                               |
| Restraint/typography | PASS: panel hierarchy unchanged; browser measures named label/detail elements at least 18px and identifiers at least 32px in both themes.                                                                                |
| Mobile               | PASS: no horizontal overflow in screenshot checks; details wrap. Components are non-interactive, so new tap targets and keyboard occlusion are N/A.                                                                      |
| Motion               | PASS: no new motion; section screenshots captured with reduced motion. Existing browser motion regression retained.                                                                                                      |
| Keyboard             | N/A for changed non-interactive output. Regions retain names and badges remain text plus decorative SVG. Existing keyboard suite passes.                                                                                 |
| Contrast             | PASS: theme contrast unit tests and rendered axe checks remain green; tone meanings and text labels are unchanged.                                                                                                       |
| Load/images          | N/A for image/font changes: none added; no new loading boundary or asynchronous detail. Release CLS certification is not claimed.                                                                                        |
| Performance          | N/A for guest-route performance: only staff primitives/showcase changed. No client boundary added.                                                                                                                       |
| Copy                 | PASS: existing staff labels retained. No guest wording or technical errors introduced.                                                                                                                                   |
| Shared components    | PASS: typed icon override added to shared StatusBadge and demonstrated by Cancelled in /dev/theme.                                                                                                                       |
| Sharing/devices      | No guest flow or Open Graph change. Physical staff-device review is not verified here; release device QA remains TICKET-201.                                                                                             |
| QR                   | N/A: no QR output or credential changes.                                                                                                                                                                                 |
| Staff feedback       | PASS for text size, fixed colours and non-colour cues. Sound/vibration N/A: these passive components do not scan or admit guests.                                                                                        |
| Verification         | PASS: quick/full gates, 251 unit tests, 155 browser passes and 17 conditional skips.                                                                                                                                     |

## Verification record

Regression-first: five failures and 15 passes. After implementation: 20 focused status tests pass. The first full browser run overlapped the screenshot command and lost trace files because both use test-results/. Those results are not accepted as clean verification. Screenshot rerun alone: six passed. Full verification rerun alone passed: 251 unit tests, 155 browser passes and 17 conditional skips, plus lint, types, formatting, ticket validation and build. No tests, retries or hooks were weakened.

## Review disposition

No blocking source or visual findings for this narrow change. Leave the PR for human review rather than extending the preview-merge exception to shared-component work. TICKET-015 remains paused; real-device/release readiness is not certified by this task.
