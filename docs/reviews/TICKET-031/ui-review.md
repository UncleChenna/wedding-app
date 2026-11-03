# TICKET-031 UI review

2026-11-03. Routes: `/checkin`, `/kitchen`, `/bar`; shared form on `/dev/theme`.
Review remains in progress until the final full verification gate passes.

| Check                  | Result and evidence                                                                                                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots            | Staff route screenshots at 375/768/1280 in all four themes passed automated checks and were visually inspected via contact sheets. Final standard screenshots, including `/dev/theme`, are being refreshed after the header fix. |
| Tokens                 | PASS. New components reuse theme classes and shared Input/Button/Card. No literal colours, font families, radii or shadows.                                                                                                      |
| Restraint / typography | PASS. One PIN field and one primary action; display-serif heading, body text at least 18px, PIN input 24px. A real 16px override failure was corrected with scoped input styling.                                                |
| Mobile                 | PASS for browser evidence: 375/768/1280 overflow and 44px control checks in every theme. Natural document scrolling, no sticky form controls. Physical on-screen keyboards remain untested.                                      |
| Motion                 | PASS. Reduced-motion checks run across themes. The form changes status text without adding movement or blocking animations.                                                                                                      |
| Keyboard               | PASS. Real Tab navigation reaches the PIN and submit button; fields have visible labels, focus styling and status association. No dialog introduced.                                                                             |
| Contrast               | PASS. All-theme axe scans pass. Status text communicates the outcome without relying on colour.                                                                                                                                  |
| Load / images          | PASS. Twelve delayed-font production checks now report exact zero CLS. A tiny right-aligned header text shift was fixed with fixed columns and start-aligned text. No image or QR output changed.                                |
| Performance            | N/A for the guest Lighthouse threshold: these changes affect staff entry and developer previews, not guest routes. The broad regression gate still covers guest routes.                                                          |
| Copy                   | PASS. Short, warm wrong/expired/locked/unavailable messages explain the next step. These are new staff messages; the PRD has no prescribed PIN-error sentences.                                                                  |
| Shared components      | PASS. Input and Button reused; the same form has a non-authenticating `/dev/theme` preview.                                                                                                                                      |
| Sharing / devices      | N/A for WhatsApp/OG guest checks: no guest flow or public preview changed. Physical staff devices are not certified; operational device QA remains a release prerequisite.                                                       |
| QR                     | N/A. This ticket changes no QR content, quiet zone or scanning behavior.                                                                                                                                                         |
| Staff feedback         | PASS. Immediate checking/signing-in text and disabled submission while pending; outcome text is announced. Scan haptics/sound are N/A because scanning remains a separate ticket.                                                |
| Verification           | PENDING final full gate. The first gate passed 876 unit tests and build but had nine browser failures. Corrections pass the focused review; do not treat the first run as green.                                                 |

## Evidence and failures retained

- `artifacts/TICKET-031/full-verify.log`: initial gate, 766 browser passes, 165 skips, nine failures.
- `artifacts/TICKET-031/initial-gate-failures/`: preserved traces and screenshots.
- `artifacts/TICKET-031/focused-browser.log`: corrected typography/status/metadata, 20 passes and two opt-in skips.
- `artifacts/TICKET-031/header-alignment-review.log`: 12 zero-CLS passes.
- `artifacts/TICKET-031/final-staff-journey.log`: mobile/desktop production sign-in, two passes in 14.3s.

The metadata failure was test interference: a parallel synthetic fixture changed
the event date to 2099. Its exact records were removed, and the unchanged metadata
assertion passed in the serial focused review. Never run fixture-changing suites
alongside the browser gate in one worktree. Proposed harness follow-up: an
exclusive per-worktree verification lock shared by fixture runners and `verify`.
That harness change is not implemented in this ticket.
