# TICKET-109 UI review — 2026-11-01

Base: develop c9edef6cb137a194f9c215fc5b61b08488a54aa0. Implementation: bac98df.
PR: https://github.com/UncleChenna/wedding-app/pull/65

## Result: APPROVE for preview delivery; release checks remain outstanding

Installation control behavior passes automated verification. This is not a real-device installation certification. Invitation performance is below the 95 target; device checks remain unverified.

| Check             | Result and evidence                                                                                                                                                                                                                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots       | PASS for changed controls and staff layouts: 36 visible route/theme/width combinations, 60 PNGs under this directory. All control crops and staff pages inspected in contact sheets. Repository screenshot command also passed 36 cases; full unchanged theme-showcase slices remain in artifacts/screenshots, not separately certified here. |
| Tokens            | PASS: shared Button, theme classes only, no new literal colors/fonts/radii/shadows.                                                                                                                                                                                                                                                           |
| Restraint / type  | PASS for controls: two concise actions, 18px text, no decoration or overlay; staff pages still contain existing placeholder content.                                                                                                                                                                                                          |
| Mobile            | PASS: no horizontal overflow at 375/768/1280, controls at least44px, normal document flow cannot cover content. Physical keyboard/safe-area behavior not verified.                                                                                                                                                                            |
| Motion            | PASS: reduced-motion review; no new animation. Existing shared button color transitions retained.                                                                                                                                                                                                                                             |
| Keyboard          | PASS: visible outline, Tab to Not now, Enter dismisses; 14 permanent browser cases. Native operating-system dialog keyboard behavior not verified.                                                                                                                                                                                            |
| Contrast          | PASS: all36 visible combinations have zero axe WCAG A/AA violations.                                                                                                                                                                                                                                                                          |
| Load / images     | PASS measured invitation CLS0 on three production Lighthouse runs. Reserved control row prevents late eligibility moving nearby content. No new images.                                                                                                                                                                                       |
| Performance       | FAIL: mobile /dev/invitation performance86/91/92, median91; accessibility100/100/100. LCP3.9/3.4/3.2s; TBT150/100/90ms. Existing baseline had performance deficits, but this does not prove this change has no effect. Preserve results and require release remediation.                                                                      |
| Copy              | PASS provisional utility copy: Install app, Not now, Opening…. No offline promise.                                                                                                                                                                                                                                                            |
| Shared components | PASS: shared Button; live pattern mounted in each /dev/theme section and captured using a browser-event stub.                                                                                                                                                                                                                                 |
| Sharing / devices | NOT VERIFIED: physical Android/Chrome native installation and WhatsApp iOS/Android. TICKET-114 covers installation-device QA; TICKET-201 covers guest release performance/WhatsApp. No device result is claimed.                                                                                                                              |
| QR                | N/A: no QR output changes. Real pass content is still TICKET-044; conditional mounting is present but no production guest pass is certified.                                                                                                                                                                                                  |
| Staff feedback    | PASS for added controls:18px, immediate Opening… feedback, disabled during native prompt. No scan/status changes.                                                                                                                                                                                                                             |
| Verification      | PASS local full gate:522 unit passed,26 skipped;575 browser passed,135 skipped. Expanded install suite subsequently14 passed. Final-head CI still required.                                                                                                                                                                                   |

## Evidence

- Visible review measurements: [visible-review.json](visible-review.json).
- Three raw Lighthouse JSON reports: performance-1.json, performance-2.json, performance-3.json.
- Screenshot paths: THEME/WIDTH/checkin.png, kitchen.png and three control crops.
- Ignored local logs: artifacts/TICKET-109/{verify.log,prompt-browser.log,screenshots.log,performance.log}.
- Initial review helper failures were harness-only: tsx serialized a named callback helper, then axe required an explicit BrowserContext. Fixed both without product or assertion changes. Review was resumed from completed combinations after the full-gate server exited.

## Required before release

Resolve performance to95+, run actual native installation on Android/Chrome and physical guest WhatsApp checks, and integrate the real guest pass. Unavailable checks are not passes.

## CI result — 2026-11-01

Run41254671961 for bac98df failed the desktop envelope zero-CLS tests in Midnight & Champagne and Emerald Night, including retries. Both report0.0001711703703703704 from the Adaora name span. This matches the observed TICKET-104 failure; shared baseline causality is not yet proven. The zero target is retained. Local full verification passed; hosted CI did not. PR65 remains a draft and cannot proceed on these results. Raw failed-job output is in artifacts/TICKET-109/ci-failure.log.

## 2026-11-01 — integrated verification

Integrated develop3dae6a38946ddc3419363fb18ed688670d0d02c3 in8f053f9; documentation head2c3de64.
Full local pnpm verify PASS:534unit passed/26skipped;631browser passed/135skipped. Hosted CI41289827331 passes all four jobs. The formerly failing font/envelope tests now pass without weakened assertions.

Three serial production Lighthouse measurements on /dev/invitation: Performance90/92/90 (median90), Accessibility100 each, CLS0 each. Raw integrated-performance-{1,2,3}.json reports are retained alongside earlier measurements. Performance is FAIL against95; this is not a release sign-off. No claim is made that the prompt caused or did not cause the deficit.

The owner approved preview delivery with remaining device/performance QA tracked separately. TICKET-201 now explicitly retains these measurements and real Android/native-prompt/WhatsApp checks, blocking both releases;114 retains full PWA installation. Physical device checks are NOT VERIFIED. The preview approval relies on that exception, not a passing performance score.
Icon metadata and prompt registration both survived integration. Existing reviewed control artwork and styles are unchanged; merged210 owns the reviewed font-origin correction.
