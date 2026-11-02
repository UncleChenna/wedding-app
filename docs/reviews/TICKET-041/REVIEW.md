# TICKET-041 UI review — 2026-11-02

Status: preview ready for review after the final PR gate. Physical-device and strict cold-font release gates remain in TICKET-201 under the existing preview exception; this is not release approval.

| Check                    | Result and evidence                                                                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots              | PASS: 24 captures in the four theme folders, party section and full invitation at 375/768/1280. All images and long-page slices inspected; no clipping.                                  |
| Tokens                   | PASS: existing Input, Select, Textarea and Button use theme variables; no new colour/font/radius/shadow literals.                                                                        |
| Restraint and typography | PASS: one party section, serif heading, body controls, grouped fields, one save action.                                                                                                  |
| Mobile                   | PASS in emulation: overflow and 44px dimensions asserted at all review widths. Physical keyboards/safe areas remain unverified.                                                          |
| Motion                   | PASS: both reduced-motion modes exercised; editor adds no animation.                                                                                                                     |
| Keyboard                 | PASS: add focuses the new name, remove restores an earlier name, name-to-meal Tab order asserted; status focuses after submission.                                                       |
| Contrast                 | PASS: axe scan in all four themes and both motion modes.                                                                                                                                 |
| Load and images          | NOT VERIFIED: exact-zero cold-font CLS remains a TICKET-201 release gate. No new images/fonts introduced.                                                                                |
| Performance              | PASS: production mobile Performance98/100/100, Accessibility100/100/100, measured CLS0/0/0. Raw local reports: artifacts/TICKET-041/lighthouse-personal-{1,2,3}.json.                    |
| Copy                     | PASS: PRD tag-along prompt; other helper/error text uses the approved Warm voice and is provisional product copy.                                                                        |
| Shared components        | PASS: existing form controls reused; no new generic UI pattern or tokens.                                                                                                                |
| Sharing/devices          | NOT VERIFIED: physical iOS/Android WhatsApp and preview checks remain mandatory in TICKET-201. No social metadata changes.                                                               |
| QR                       | PASS for signed-pass integration: original issued pass reflects3 then2 guests and excludes dietary notes. Physical scanning remains unverified in TICKET-201; QR rendering is unchanged. |
| Staff feedback           | N/A: no staff screen changed.                                                                                                                                                            |
| Verification             | PASS: full gate passed789 unit/database and769 browser cases;41 unit and165 browser skips remain unverified.                                                                             |

Behavioral evidence: 11 validation tests and 6 isolated database cases pass. The browser flow adds two tag-alongs, removes one, reloads saved details, checks the count and rejects a tampered over-limit payload. An initial accessible-name mismatch on Remove guest was fixed; the unchanged axe requirement then passed. Final hydration/no-JavaScript browser rerun passes (18.4s).

The party editor requires JavaScript. Its controls remain disabled before hydration and without JavaScript, with a contact-the-couple fallback. Attendance yes/no retains its existing no-JavaScript Server Action.

Signed review: scripts/review-party.ts uses ephemeral signing keys. Expanded party browser test passes (11.2s), including all-theme accessibility, original pass count refresh, tampered-limit rejection and no-JavaScript attendance. First attempt followed the app-port absolute URL instead of the test-server port; the fixture now preserves the signed path on the Playwright origin, as existing pass tests do. No product change or assertion relaxation.

Production Lighthouse on the saved two-person party: three serial runs,98/100/100 performance,100 accessibility each,0 measured CLS each. Fixture and meal rows were removed after measurement. These three loads do not replace the separately required cold-font regression or physical-device checks.
