# TICKET-207 font verification

2026-10-31. Base: fd91e877e29b32ef911acfd45036ad65767732c7.

## Implementation and evidence

Local WOFF2 assets bypass the failing NextFontGoogleFontFileReplacer resolver. The original CI error is recorded; an unchanged local build passed, so this is not a deterministic reproduction or a compiler repair. Sources, hashes, licenses and generation instructions live in src/modules/theming/fonts.

Small Latin primary files preserve the previous Google font feature set; complete faces load on demand for other characters. Browser assertions compare actual pixel output and text width at weights 400/500/600 across five faces. No external font requests, no-JavaScript rendering and non-Latin loading pass (8 browser cases); typography regressions pass (8 cases). Five asset unit tests pass.

Three final builds with FONT_COLD_BUILD=1 passed (final-cold-1/2/3.log). This uses the documented Next filesystem-cache switch; no output/cache was manually deleted.

## Visual evidence

60 Playwright capture cases cover /, /dev/theme, /dev/invitation, /dev/rsvp and /admin/sign-in in four themes at 375/768/1280. The index maps 436 full-page/slice files to 188 unique review frames. The sheets contain the final captures. Initial sheets were inspected; final pixel comparison found 375 identical files and 61 changed files. Changed sliced frames were inspected again: typography remains legible, controls wrap and no horizontal clipping appeared. Spinner animation phases vary between captures. Full-page capture differences are not treated as a pixel-perfect baseline assertion.

## Performance

Serial production Lighthouse mobile runs; accessibility is 100 throughout:

| Route           | Final performance | CLS             |
| --------------- | ----------------- | --------------- |
| /               | 100 / 100 / 100   | tiny / tiny / 0 |
| /dev/rsvp       | 100 / 100 / 100   | 0 / 0 / 0       |
| /dev/invitation | 90 / 93 / 93      | 0 / 0 / 0       |

Homepage tiny CLS is approximately 0.00007339, not zero. Retained Google-font baseline invitation scores were 89/94/94. Initial full-font implementation scored 77/79/79 and was optimized before readiness. Intermediate and final JSON measurements are preserved. These results do not satisfy the invitation's 95 release threshold; TICKET-201 retains performance/device release checks.

## UI checklist

| Item                     | Result and evidence                                                                                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots              | PASS: captures and inspected sheets/index above.                                                                                                           |
| Tokens                   | PASS: public font variables and theme tokens preserved; registry contains the required family definitions. No new color/radius/shadow tokens.              |
| Restraint and typography | PASS: existing roles and spacing preserved; all-theme typography and browser raster comparisons pass.                                                      |
| Mobile                   | PASS for browser layouts: existing responsive/tap-target suite and captures; physical keyboard/safe-area behavior not verified on devices.                 |
| Motion                   | PASS for browser tests: existing reduced-motion behavior unchanged; no animation implementation added.                                                     |
| Keyboard                 | PASS for browser regressions: existing controls/focus semantics unchanged.                                                                                 |
| Contrast                 | PASS for automated browser checks and Lighthouse accessibility 100; no color edits.                                                                        |
| Load and images          | FAIL strict zero-CLS on homepage; RSVP/invitation measured zero. next/font/local uses swap and preserved fallback metrics. Image implementation unchanged. |
| Performance              | FAIL invitation 95 target; baseline also below target. Home and RSVP pass.                                                                                 |
| Copy                     | PASS: existing approved copy unchanged.                                                                                                                    |
| Shared components        | PASS: existing font registry/showcase reused; no new UI pattern.                                                                                           |
| Sharing and devices      | Not verified: physical WhatsApp iOS/Android testing remains a release gate.                                                                                |
| QR codes                 | N/A to new physical scan requirement: QR output unchanged. Existing QR tests retained.                                                                     |
| Staff feedback           | Typography samples inspected in all themes; feedback logic unchanged, no device sound/vibration certification.                                             |
| Verification             | Final full gate result recorded in handoff; required final-head CI must also pass.                                                                         |

This is engineering evidence, not release/device approval. Do not mark the ticket done with required checks outstanding.

## Review authorization

2026-10-31: The user approved proceeding to review with existing release gates retained in TICKET-201. The FAIL and not-verified results above remain unchanged. Required CI41238775314 passed on7c2f73c9ad97dfe2873d7962457f149f6fb3f7b3. Review permission is not a release pass.
