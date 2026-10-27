# TICKET-050 UI review — 2026-10-27

Base: bc15aa088fc27164e0108ab9fb17dc313d3ae0ec. Routes: /dev/share and /dev (navigation link). This is a reusable admin feature with a sample-only preview, not production guest-list integration.

## Evidence and findings

Inspected all 18 screenshots: closed share preview, open menu, and preview directory in ivory-gold and midnight-champagne at 375/768/1280. Mobile uses the bottom sheet; larger widths use the centred panel. Body/action text is 18px in the menu; the 32px heading, token palette, whitespace and single main preview action are restrained. No visual blockers found.

The original browser regression failed because the menu was absent. All 15 subsequent production browser cases passed, including real Chromium clipboard readback, denied clipboard permission, legacy copy success, manual selection, thrown fallback errors, native capability detection, cancellation and rejection. Native outcomes are mocked, not evidence of real message delivery. A separate production test measured load CLS = 0. Full gate: 359 unit passes (10 opt-in DB skips), build, 207 browser passes (29 conditional skips), no retries. Final CLI gate will include the added CLS test.

## Checklist

| Item                   | Result       | Evidence                                                                                                                                                                        |
| ---------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots            | PASS         | 18 adjacent PNGs, all inspected; generated with screenshot command and CAPTURE_SHARE_SCREENSHOTS=1 browser cases.                                                               |
| Tokens                 | PASS         | No colour literals in new components; theme classes for colours/fonts/radii. No new tokens.                                                                                     |
| Restraint / typography | PASS         | Visual review above; 18px action/body text, serif headings, uncluttered menu.                                                                                                   |
| Mobile                 | PASS         | Browser tests at 375/768/1280, no overflow, all menu controls at least 44px; manual fallback stays visible at 375x568; shared sheet supplies safe-area padding.                 |
| Motion                 | PASS         | Tests explicitly use reduced motion; no new animations. Existing shared controls retained.                                                                                      |
| Keyboard               | PASS         | Enter opens, Shift+Tab wraps, Escape closes, trigger focus returns; fallback input selected/focused.                                                                            |
| Contrast               | PASS         | Axe WCAG A/AA scans with the actual open sheet in both themes; shared theme contrast gate passes.                                                                               |
| Load / images          | PASS         | Separate production CLS test = 0. No new images/fonts; existing next/font configuration used.                                                                                   |
| Performance            | N/A          | Admin component and development previews only; no guest page changed. Lighthouse not measured and no score claimed.                                                             |
| Copy                   | PASS         | Clear action labels and recovery copy; sample message is explicitly provisional until TICKET-052. No raw browser errors displayed.                                              |
| Shared components      | PASS         | Existing Sheet, Button, Input, Select and Toast used. No shared primitive changed; /dev/theme remains unchanged. Feature preview is /dev/share.                                 |
| Sharing / devices      | NOT VERIFIED | Physical iOS/Android WhatsApp and mail apps, real native sharing, OG preview delivery not exercised. Deferred QA under the user's preview authorization, tracked by TICKET-201. |
| QR                     | N/A          | No QR output changed.                                                                                                                                                           |
| Staff feedback         | PASS         | Copy confirmation after modal closes; native failure offers recovery, cancellation stays quiet; pending operations disable repeated buttons. No scanner feedback involved.      |
| Verification           | PASS         | Full local gate result above; separate CLS test passes. Hosted CI and final CLI gate still required.                                                                            |

APPROVE for the authorized preview scope with the disclosed device QA deferral. This is not unconditional release/device approval.

## Reproduce

Run pnpm dev in this worktree and visit http://localhost:22610/dev/share (also linked from /dev). Open Share invitation, tab through controls, copy the link, switch theme and repeat. WhatsApp/email targets contain sample contacts; inspecting their URLs does not send a message. Browsers with native sharing expose More ways to share. Automated failure-path fixtures are in e2e/share-menu.spec.ts.

Source behavior references: [native sharing and cancellation](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share), [clipboard permissions](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText).

Final CLI gate passed after the CLS-test type annotation fix: 359 unit passes (10 conditional skips), build, 209 browser passes (29 conditional skips), no retries. PR46 is in_review; hosted CI remains required.
