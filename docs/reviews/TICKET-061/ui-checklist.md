# TICKET-061 UI evidence

2026-11-09. Staff-screen scope under TICKET-217; production build on base 2df977c6. All screenshots use synthetic fixtures, never actual guest data.

| Check                | Result and evidence                                                                                                                                                                                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots          | PASS browser capture:144 files across mobile/desktop projects, six states, all four registered themes,375/768/1280. `mobile/` and `desktop/`; independent visual review pending. Additional camera regression evidence is retained in `camera-mobile/` and `camera-desktop/`. |
| Tokens               | PASS: existing Card, Input, Button, StatusBadge and theme classes. No hard-coded colour/font/radius/shadow.                                                                                                                                                                   |
| Typography/restraint | PASS: body text18px, display headings, large count and semantic receipt. Same narrow content column; wrapping checked in browser.                                                                                                                                             |
| Mobile               | PASS: all state/theme/width checks have no horizontal overflow and every visible button/link meets44px. Initial Open camera is in375×812 viewport; selected-count action is keyboard operable.                                                                                |
| Motion               | PASS: actual flow runs with reduced motion enabled; no new animation or action delay.                                                                                                                                                                                         |
| Keyboard             | PASS: keyboard submits the selected count; committed and duplicate receipt containers receive focus. Labels are associated; next-pass disabled only while the transaction outcome is pending/uncertain.                                                                       |
| Contrast             | PASS: axe returns zero violations in every theme for all six states. Fixed semantic green/amber plus explicit text/icon.                                                                                                                                                      |
| Load/images          | N/A new media: no images, new fonts or assets. Existing font/layout release checks remain TICKET-201; fresh exact-zero load CLS is not certified by this ticket.                                                                                                              |
| Performance          | N/A Lighthouse for staff-only interaction under TICKET-217.                                                                                                                                                                                                                   |
| Copy                 | PASS: approved Warm Welcome/table sentence appears only after committed admission. Duplicate explicitly prohibits admitting again; pass check states no admission.                                                                                                            |
| Shared components    | PASS: uses existing primitives. This feature-specific admission workflow is not a new general component or theme token.                                                                                                                                                       |
| Sharing/devices      | No sharing/guest WhatsApp changes. Physical phone/camera/event-condition checks remain unverified and mandatory under TICKET-201.                                                                                                                                             |
| QR output            | N/A: no QR rendering/payload/signature format change. Existing real-pixel scanner regression passes; this is not physical-camera certification.                                                                                                                               |
| Staff feedback       | PASS: unchanged supported sound/vibration remains a pass-check signal, explicitly labelled; committed admission has immediate visible receipt. Browser scanner recovery remains2/2 passing.                                                                                   |
| Verification         | Build, quick, isolated SQL5/5, new browser2/2 and existing camera2/2 pass. Full coverage/final integrated CI pending.                                                                                                                                                         |

Independent backend review found no blocker. UI source review identified stalled-network recovery; separate eight-second transport abort now bounds both headers and body without clearing the immutable retry intent. Fake-timer tests cover both stalls and unmount cleanup. Final source/visual review remains required before ready publication.

## Review repairs — 2026-11-09

- A stalled transport is bounded to eight seconds, including response-body consumption. Headers/body stall regressions preserve the original intent for retry; unmount aborts transport and removes the timer.
- Independent review reproduced a phone visibility bug: clearing the result could discard an unresolved admission ID. The scanner now stops capture/audio while keeping the admission component mounted. A scanner-level red/green regression and actual committed-then-lost-response browser case prove hidden/visible transitions preserve the same request.
- Invalid, revoked, conflict and expired-session submit results use fixed danger colours and a cross icon; already-used and waiting cases remain amber. A revoked-after-check browser case covers every theme.
- Final scoped quick passes lint/types and18 related tests. Actual production browser2/2 passes 33s. Existing unchanged camera regression2/2 passes 1.2m. The full unit rerun before the visibility repair passed 1677 tests with 190 conditional skips; coverage 98.30% lines / 98.51% branches. Final integrated suite remains required after TICKET-108.
- Owned native PostgreSQL 36261 is stopped with its synthetic data directory preserved; the database slot was released to TICKET-123. No production operation.

## Independent final review

2026-11-09: backend review and separate UI review are clean at source e26b9b16. The UI reviewer inspected all 144 state screenshots and confirmed the visibility/intent and fixed-status repairs. No remaining material source or visual finding. This does not certify physical devices; final TICKET-108 integration and final-head CI remain outstanding.

## Final integrated verification — 2026-11-09

Verified TICKET-108 base143b4d637b8bfc4597f8f990a5085f2722454967 integrated as08d3cea6. SoleCI conflict resolved by retaining both admission steps and all offline checks/generator semantics. No product conflict. Independent bounded integration review is clean, including all eight new offline screenshots; prior full144admission-image review applies to unchanged UI.

- Full unchanged serial unit/coverage:1764passed,190conditional skips,121.53s;98.30%lines/98.51%branches at unchanged per-file95% requirement. An earlier integrated run hit the existing pass-image5s timeout; recorded failure is retained and no assertion/timeout changed.
- Integrated isolated SQL5/5pass493ms; production generator/build pass.
- Integrated admission browser2/2pass34.3s; initial mobile decode wait timed out once, unchanged serial rerun passes. All144captures regenerated.
- Integrated authenticated offline browser2/2pass37.3s, all-themeaxe and exact-zero loadCLS pass; eight screenshots/timings retained under offline-mobile/offline-desktop.
- Owned database stopped with synthetic data retained; no heavy process remains. Final exact-headCI is required before merge.

## Combined ordering integration and decode diagnostics — 2026-11-09

Final integrated base is `debc5b347a26b2f69f5ada2f69841bc66de6c858`, integrated as `f7ed299f`. The unchanged ordering migration is preserved, and its browser fixture remains last after all scanner/admission checks.

- Full serial unit/coverage: **1777 passed, 191 conditional skips, 81.14s**; **98.30% lines / 98.51% branches**, unchanged per-file 95% thresholds. Production generator/build and final lint/types pass.
- Isolated admission SQL **5/5 passed (477ms)**; shared request-budget SQL **6/6 passed (943ms)**. Authenticated offline scanner **2/2 passed (1.1m)**; ordering-last browser **2/2 passed (19.4s)**. Owned native database is stopped with its synthetic data directory retained.
- Initial QR decoding remains intermittently flaky: the first local admission run after each of the last two integrations timed out at the unchanged five-second Valid pass assertion. Hosted integration run `42715749631` also reported a desktop first-attempt timeout that passed its retry. These are not unqualified first-attempt passes, and no product fix or root cause is claimed.
- Added failure-only synthetic video-frame/resource diagnostics; the original assertion and error remain unchanged. Missing video or failed diagnostics cannot mask that error. No guest credentials, private keys or raw PINs are captured. Independent review of this delta is clean.
- With diagnostics, three repeats per project passed **6/6 (1.5m)**; a fresh production build followed by admission browser passed **2/2 (31.0s)**. No failure artifact was produced because these attempts passed. Timeouts, retries and assertions were not relaxed.
- Final diagnostic-head CI remains required before merge. Physical camera/device checks remain mandatory in TICKET-201; the intermittent synthetic decode behavior is disclosed for follow-up rather than represented as fixed.
