# TICKET-199 UI review

26 October 2026. APPROVE for the labelled preview under the user's explicit preview-merge exception. Production performance and physical-device certification remain in TICKET-201.

| Check                | Result and evidence                                                                                                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Screenshots          | PASS: 54 state captures in screenshots/, nine states × two themes × 375/768/1280. Six contact sheets reviewed plus full mobile form/error screenshots. Repository screenshot command also passed 12 route/theme/width captures for /dev and /dev/rsvp. |
| Tokens               | PASS: existing theme variables/classes and shared controls; no new colour, radius, shadow or font-family literals in feature code.                                                                                                                     |
| Restraint/typography | PASS: single form column, couple/date context, serif headings and body/control text at least 16px. Step labels describe real flow order.                                                                                                               |
| Mobile               | PASS: no horizontal overflow, 80-character names wrap, controls/links at least 44×44; long companion forms scroll normally with no fixed controls obscuring inputs.                                                                                    |
| Motion               | PASS: reduced-motion mode exercised; no new animations. Existing cancelled control transitions no longer abort the accessibility test helper.                                                                                                          |
| Keyboard             | PASS: Enter activates continuation, errors focus the invalid control, new steps focus their heading, added companions receive focus and removal returns focus to the add button. Back preserves input.                                                 |
| Contrast             | PASS: axe scans every captured state in both themes; errors and confirmations use text as well as colour.                                                                                                                                              |
| Load/images          | N/A for new images; none added. Existing font loading is retained. Full load/CLS certification is deferred to TICKET-201, not claimed passed.                                                                                                          |
| Performance          | NOT VERIFIED for release; tracked in TICKET-201 under the approved preview exception.                                                                                                                                                                  |
| Copy                 | PASS: PRD attendance/tag-along/confirmation wording used; sample rules, sample meals and non-submission are explicit throughout. Other guidance copy is provisional.                                                                                   |
| Shared components    | PASS: existing Input, Select, RadioGroup and Button reused. No new shared UI primitive.                                                                                                                                                                |
| Sharing/devices      | Developer preview is noindex; no new guest share link. Actual WhatsApp iOS/Android checks remain unverified in TICKET-201.                                                                                                                             |
| QR                   | N/A: no QR output or credentials.                                                                                                                                                                                                                      |
| Staff feedback       | N/A: guest preview only.                                                                                                                                                                                                                               |
| Verification         | PASS: quick/full gates, 239 unit tests, 138 browser passes and 16 conditional skips; 12 screenshot-command checks. Final PR gate repeats verification.                                                                                                 |

## Functional boundaries

All form data stays in React memory. Reload/start-again discard it; theme changes and Back preserve it. Tests record mutation requests and assert none are sent. Companion allowance and meals are samples, not server-authoritative rules. No real invitation lookup, persisted RSVP, edit lock, messaging or QR issuance is implemented.

## Test-helper regression

The first full run exposed AbortError when a finite CSS transition was cancelled by a step/focus change. The helper now ignores only expected animation-cancellation AbortError, waits for replacement finite animations, and propagates other failures. A regression injects an inaccessible button while cancelling an animation and proves the accessibility scan still reports button-name. Theme application also selects an interactive preview's actual theme picker rather than only changing ancestor CSS variables.
