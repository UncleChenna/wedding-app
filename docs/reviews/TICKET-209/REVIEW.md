# TICKET-209 visual review — in progress

Reviewed on 1 November 2026. Base: develop `0f30f2fc3045506944e5252adb396c40856f7e0c`.

## Evidence inspected

- `screenshots/`: all 60 initial/yes/no/error/closed RSVP captures, four themes at 375/768/1280px. Full-page contact sheets and 900px slices inspected. No clipping or overlapping controls. Attending guests retain reply editing and a pass link; declined guests retain editing and a closing message.
- `staff/`: all 48 hub/check-in/kitchen/bar captures inspected across the same matrix. Production browser checks pass for keyboard return navigation, axe, 44px controls, 18px body text and 32px headings. Recapture uses the mobile project consistently.
- `admin/`: all 36 hub/sharing/dialog captures inspected. The original ivory mobile loading-state capture was rejected and replaced after adding an explicit heading wait. Sharing is now the first hub area. Published invitations have share actions; draft/revoked invitations have guidance instead. Mobile dialogs fit the viewport and expose their exit.

## Findings and limits

1. Public/home/auth screenshot review and guest Lighthouse measurements remain outstanding. This is not a completed UI approval.
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
