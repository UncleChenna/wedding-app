# TICKET-209 visual review — in progress

Reviewed on 1 November 2026. Base: develop `0f30f2fc3045506944e5252adb396c40856f7e0c`.

## Evidence inspected

- `screenshots/`: all 60 initial/yes/no/error/closed RSVP captures, four themes at 375/768/1280px. Full-page contact sheets and 900px slices inspected. No clipping or overlapping controls. Attending guests retain reply editing and a pass link; declined guests retain editing and a closing message.
- `staff/`: all 48 hub/check-in/kitchen/bar captures inspected across the same matrix. Production browser checks pass for keyboard return navigation, axe, 44px controls, 18px body text and 32px headings. Recapture uses the mobile project consistently.
- `admin/`: all 36 hub/sharing/dialog captures inspected. The original ivory mobile loading-state capture was rejected and replaced after adding an explicit heading wait. Sharing is now the first hub area. Published invitations have share actions; draft/revoked invitations have guidance instead. Mobile dialogs fit the viewport and expose their exit.

## Findings and limits

1. Production public/auth review is complete; private invitation performance and supplemental showcase inspection remain outstanding. This is not a completed UI approval.
2. Physical iOS/Android WhatsApp behavior and real sharing previews remain not verified. Existing release gates remain mandatory.
3. The attending pass section reserves space for platform installation controls even when unsupported. The whitespace is noticeable but leaves the content readable and preserves the existing layout-stability behavior. Real pass content remains TICKET-044.
4. Ordinary staff smoke tests formerly rewrote tracked images from both browser projects. Capture is now opt-in using `CAPTURE_JOURNEY_REVIEW=1`; all behavioral, accessibility and layout assertions still run normally.

## Verification so far

- Full `pnpm verify` before the final admin layout refinement: 584 unit cases passed, 26 skipped; 731 browser cases passed, 153 skipped. Skipped cases are not certified.
- After refinement: admin hub unit test passed; production build passed; authenticated journey plus twelve staff theme/width cases passed (13 total, 1.7 minutes).
- The authenticated journey exercises email/TOTP, sharing eligibility, unchanged sent status, actual-link route traversal, focus restoration and the real offline fallback. Earlier local service failures recovered without changing assertions or timeouts.

Final checklist and verification will be recorded after the remaining evidence is complete.

## Initial production Lighthouse measurements

Lighthouse 13.6.0, mobile, production server on the assigned worktree port. One serial run per route; reports are preserved in `artifacts/TICKET-209/lighthouse-*.json`.

| Route      | Performance | Accessibility | CLS                   | Result                                    |
| ---------- | ----------- | ------------- | --------------------- | ----------------------------------------- |
| `/`        | 90          | 100           | 0.0001739702613579808 | FAIL: performance below95 and nonzero CLS |
| `/invite`  | 95          | 100           | 0.01565972421950601   | FAIL: nonzero CLS                         |
| `/order`   | 96          | 100           | 0                     | PASS for this measurement                 |
| `/offline` | 99          | 100           | 0                     | PASS for this measurement                 |

Lighthouse identifies font-loading shifts in the home venue paragraph and the guidance section. Rounded displayed CLS must not be treated as exact zero. Private invitation performance remains unmeasured for this ticket.

The additional public/auth/showcase capture completed96 cases. Files are in `public/`; inspection is incomplete. Physical-device testing is still not verified.

## Production entry-page review checkpoint — 2026-11-01

Home containers now stretch consistently, and invitation guidance uses an intentional two-line heading and shorter resend wording. Production build and quick verification passed (three related unit cases). The exact-zero cold-font regression test remains failing: baseline 14/16 failures; after local layout changes 12/16 failures. A focused follow-up passed light375 home/guide but failed dark412 home (CLS0.0002747458573055256) and guide (0.00008349233638978784), with unchanged reported source rectangles. No threshold was relaxed and no test was skipped.

Latest single-run production Lighthouse measurements: home98/100 with CLS0; guide99/100 with CLS0.0000998462969631127. The guide still FAILS exact-zero CLS. Six original and updated reports are preserved in performance/; these are individual measurements, not three-run performance certification.

All84 production public/auth screenshots (seven routes, four themes,375/768/1280) have now been inspected, replacing development-overlay captures. No clipping or overlapping controls found. Supplemental development showcase captures remain unreviewed. Actual authenticated MFA testing also passed (one opt-in local TOTP case,2.5min); all60 enrolment/setup/invalid-code/challenge/admin captures in mfa/ were inspected, including mobile bottom slices. QR/setup credentials in screenshots are public examples substituted by the existing capture helper; real authentication was tested separately.

Standard pnpm verify passed on this layout revision: format, lint, types,584 unit cases (26 skipped), production build and731 browser smoke cases (153 skipped,8.3min). It does not select the new cold-font test because the standard browser stage selects @smoke. This pass does not certify that failing regression or skipped cases. Private invitation performance and physical-device checks remain unverified. PR68 remains draft; final UI approval is outstanding.

## Invitation performance and remaining font diagnosis — 2026-11-01

Three serial production Lighthouse runs of a newly created synthetic private invitation scored Performance99/100/100, Accessibility100/100/100 and CLS0/0/0 (median performance100). Reports: performance/lighthouse-personal-{1,2,3}.json. The fixture was deleted in finally; no real guest record was used. This verifies initial private-invitation load, not physical WhatsApp/device behavior or every post-reply interaction.

A DOM Range diagnostic isolated the public-page residual shift: element boxes and baselines stay fixed, but final-font glyph widths differ from fallback widths. At dark412, the centered venue text starts at x114.90625 before fonts and x118.46875 after; guidance date starts at x127.328125 then x124 because preceding text width changes. Exact-zero cold-font regression remains failing. No font policy, assertion or threshold has changed.

Extended the existing day-of component test to all three RSVP states; six component cases pass, covering pre-event and event-day rendering. Functional acceptance criteria now reflect the passed registry, settings, state, hub, traversal and standard verification evidence. The UI criterion remains unchecked. Requested a preview-only exception for residual font shifts while retaining TICKET-201's release gate; no response or approval is assumed. Supplemental showcase review and physical checks remain outstanding.
