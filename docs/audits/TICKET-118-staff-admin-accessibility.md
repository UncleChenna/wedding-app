# Staff/admin accessibility audit — TICKET-118

## Scope and method

The owned local stack supplies real staff PIN and admin email/TOTP authentication. Chromium checks gate, kitchen/bar, staff order dialogs and nine admin routes at 375px, in all four registered themes with reduced motion. The audit records axe results, horizontal overflow, visible text/control sizes and primary identifiers. Keyboard submission, navigation, modal Escape/focus return and settings focus clearance are exercised. This is not physical arm’s-length or screen-reader certification.

## Findings and repairs

| Finding                                                           | Repair                                                                                                            | Evidence                                                                                               |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Staff and order Note labels were 14px                             | Existing 18px utility on Staff, Note and Dietary labels                                                           | Baseline screenshots/results; corrected board audit passes                                             |
| Admin labels, hints and controls rendered at 13–16px              | AdminShell raises only small/base/type-label/label descendants to 18px; guest component defaults remain unchanged | Nine admin routes × four themes have no detected axe violation, overflow or sub-18px text after repair |
| Staff order dialog inherited guest-sized descriptions and inputs  | Scoped dialog minimum, retaining shared Sheet/Input components                                                    | Actual keyboard-opened kitchen/bar dialogs pass all-theme text/axe checks; Escape returns focus        |
| Valid-pass guest/table identifiers used 30px                      | Existing 36px utility on online/offline admission identifiers and scan-result table                               | Real camera baseline records table at 30px; corrected result records 36px                              |
| Fixed mobile admin navigation can cover focused settings controls | Scoped mobile scroll clearance; desktop reset                                                                     | Actual focused-control center hit-test failed before repair; final focused admin retest passes         |

These are project legibility thresholds; WCAG does not prescribe an 18px minimum. The automated audit does not certify every possible route or state.

## Separate reliability finding

The longer all-theme signed-camera run retained the existing exact-one observation assertion and found two zero-admission `not_rsvped` observations. Camera suppression lasts three seconds; a slow read can receive another callback and abort the browser request after the server has logged its observation. No admission was granted. TICKET-238 tracks a separate bounded race repair with delayed-response evidence; the assertion has not been loosened. A PIN request also remained pending beyond the existing five-second check under local load; that failed run is not counted as passing.

## Final automated results

- Production build passes on integrated develop 979609e6.
- Final admin journey: 1 passed in 46.9s, including every enabled settings control focus hit-test.
- Final operational journeys: 2 passed in 45.1s, including all five actual signed-camera verdicts and keyboard order dialogs.
- 22 states × four themes = 88 axe scans with zero violations, no horizontal overflow and no text/control below 18px. Measured primary identifiers meet 32px (scanner values are 36px).
- Independent source review found no blocker. Screenshots of the actual valid result, settings and order dialog were visually inspected.
- The earlier duplicate observation remains tracked by TICKET-238 despite the passing quiet rerun.

## Evidence and reproduction

Baseline evidence: `docs/reviews/TICKET-118/baseline/`. Final per-screen/per-theme JSON and 375px screenshots: `docs/reviews/TICKET-118/`. The audit uses synthetic records only. Retained fixtures belong to this isolated database; generated staff/device identities are revoked and owned event settings removed after the run.

Run `pnpm exec tsx scripts/review-staff-accessibility.ts --build` in this managed worktree with its own Auth/database stack. `--admin` selects the admin journey for a bounded repair retest. The existing camera matrix still checks five verdicts, private-data exclusion, immutable observations, stopped camera tracks, automatic queue readiness and no admissions.

## Release requirements

TICKET-201 retains physical event-device arm’s-length reading, realistic lighting, VoiceOver/TalkBack and software-keyboard checks. Record actual device/model/OS/browser/build and results before release. Desktop emulation, axe and CSS measurements do not replace them. Guest sharing, QR generation and guest performance are unchanged by this ticket.
