# TICKET-030 UI review — 28 October 2026

Base develop: f7e8fac048514058030d28d7b3a61f168de014f9.

Routes: /admin/mfa (enrolment, setup, invalid code, returning challenge), /admin, and /dev/theme for the shared QR renderer. Review screenshots contain a labelled public example key and matching example QR, never an enrolled credential.

## Evidence

- [Ivory & Gold](ivory-gold-review.png), [Midnight & Champagne](midnight-champagne-review.png), [Emerald Night](emerald-night-review.png), [Blush & Sage](blush-sage-review.png).
- All 60 original captures: screenshots/<theme>/<375|768|1280>/<state>.png.
- All 12 showcase contact sheets, including every long-page slice: showcase/<theme>-<width>.png.
- Every contact sheet inspected. No clipping, lost controls or QR quiet-zone regression found.
- Real isolated email/TOTP flow: four mobile/desktop tests pass, including a fresh returning-user challenge and CLS assertions.
- CAPTURE_MFA_SCREENSHOTS=1 matrix: two tests pass, 60 captures; axe AA, horizontal overflow, 44px targets, keyboard focus and rendered QR decoding checked.
- Production showcase capture: 12 tests pass. Existing QR decode tests remain in the full gate.

## Checklist

| Item                     | Result                           | Evidence                                                                                                                                                         |
| ------------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots              | PASS                             | Five states × four themes × three widths, plus shared showcase; inspected above.                                                                                 |
| Tokens                   | PASS                             | Changed MFA and QrMark components contain no hard-coded colour, font family, shadow or radius. Existing theme utilities and QR ink/paper tokens.                 |
| Restraint and typography | PASS                             | Single primary action, display heading, 18px MFA body and controls, 24px grouping, restrained decoration. Existing admin placeholder content is unchanged.       |
| Mobile                   | PASS (emulated)                  | No overflow at 375/768/1280, 44×44 controls, wrapping manual key, normal-flow actions and safe-area padding. Native phone keyboard behaviour remains unverified. |
| Motion                   | PASS                             | Existing shared reduced-motion rules; no new animation. Bounded completion checks before axe capture.                                                            |
| Keyboard                 | PASS                             | Visible tab focus and labelled fields; status receives focus; native details disclosure. No modal added.                                                         |
| Contrast                 | PASS                             | Axe WCAG A/AA in all captured states/themes; text describes errors without colour-only meaning.                                                                  |
| Load and images          | PASS                             | CLS = 0 on enrolment and returning challenge in both browser projects; existing next/font setup. No photography; SVG QR reserves its aspect ratio.               |
| Performance              | N/A                              | No affected guest page; guest Lighthouse threshold does not apply to authenticated MFA.                                                                          |
| Copy                     | PASS                             | Plain, calm admin instructions, generic errors and recovery guidance; no guest invitation wording changed.                                                       |
| Shared components        | PASS                             | Button/Input reused; QrMark is also rendered through existing QrCode on /dev/theme.                                                                              |
| Sharing and devices      | N/A for sharing                  | Private admin routes are noindex/no-referrer; no guest sharing flow changed. Native authenticator device QA remains below.                                       |
| QR codes                 | NOT VERIFIED on physical devices | Rendered QR decodes in all themes/widths; four-module quiet zone preserved. Actual iOS/Android authenticator scanning has not been performed.                    |
| Staff feedback           | PASS for new MFA UI              | 18px controls/body, immediate pending/error feedback. Gate sound/vibration N/A: no gate scanner changed.                                                         |
| Verification             | PASS                             | pnpm verify passed: 446 unit / 16 opt-in skips; 481 browser / 129 conditional skips; format, lint, types and production build passed.                            |

## Findings and decision

CHANGES REQUESTED for release approval: obtain physical iOS and Android authenticator evidence (scan, generated-code verification, returning challenge and keyboard). Automated browser testing does not prove this. Code may be reviewed independently; do not call physical checks passed. A separate explicit QA deferral is required before closing this UI ticket without that evidence.

The first full gate found 11 tests racing the newly streamed admin redirect and one oversized all-theme admin form test exceeding its timeout. Tests now await the verified sign-in destination before measuring or navigating onward; the form matrix is split into route/theme cases with every original assertion retained. Focused rerun passes. No assertion, hook or gate was removed.

## 2026-10-31 — approved merge with release QA outstanding

The user explicitly approved: “Merge after CI; track device QA separately.” TICKET-206 records physical iOS/Android authenticator scanning and keyboard checks; both production-release tickets TICKET-176 and TICKET-154 depend on it. Physical checks remain NOT VERIFIED. Merge is authorized only after all required checks pass on the final commit. This exception does not approve production release.
