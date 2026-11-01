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

## Consolidated UI checklist — 2026-11-01

Overall: CHANGES REQUESTED; no final UI approval. Functional criteria are verified, but load stability and physical-device requirements remain unresolved.

| Check                    | Result and evidence                                                                                                                                                                                                                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Screenshots              | PASS for inspected layouts:60 RSVP,48 staff,36 admin,84 production public/auth and60 authenticated MFA captures. Supplemental /dev/theme review now covers all356 long-page slices via128 byte-distinct sections at375/768/1280. No clipping/overlap found. Development captures include an issue badge; they are supplementary, not production screenshots. |
| Tokens                   | PASS: changed src additions contain no literal hex/RGB colours, font-family overrides or arbitrary shadow/radius values; existing theme classes are reused.                                                                                                                                                                                                  |
| Restraint and typography | PASS in inspected layouts; staff browser assertions enforce18px body and32px headings. Long names wrap. Existing reserved installation space remains visible and documented.                                                                                                                                                                                 |
| Mobile                   | PASS for automated overflow/tap-target checks in RSVP/staff/MFA flows and inspected admin/public layouts. Physical keyboard and safe-area behavior NOT VERIFIED.                                                                                                                                                                                             |
| Motion                   | PASS for existing reduced-motion smoke coverage and reduced-motion journey reviews. No new animation is introduced.                                                                                                                                                                                                                                          |
| Keyboard                 | PASS for RSVP next-step focus, staff return navigation, MFA flow and authenticated sharing dialog escape/focus restoration.                                                                                                                                                                                                                                  |
| Contrast                 | PASS for automated WCAG A/AA axe coverage across routes/themes and authenticated review states; status meaning includes text.                                                                                                                                                                                                                                |
| Load and images          | FAIL: public home/guide cold-font test detects horizontal text movement. Private invitation has zeroCLS in three measured loads. No photograph implementation changed.                                                                                                                                                                                       |
| Performance              | Latest production home98, guide99, order96, offline99; accessibility100. Private invitation99/100/100 (median100), accessibility100 throughout. Home/guide/order/offline have only single latest measurements; release three-run coverage remains outstanding. Earlier lower results are preserved.                                                          |
| Copy                     | PASS: approved invitation wording reused; guidance and placeholders provide human next steps without technical errors.                                                                                                                                                                                                                                       |
| Shared components        | PASS: existing form, share, placeholder and typography components reused. Supplementary theme showcase inspected; no token or base component API was introduced.                                                                                                                                                                                             |
| Sharing and devices      | NOT VERIFIED on physical iOS/Android WhatsApp. Browser clipboard/share and admin eligibility checks pass; TICKET-201 release gate remains.                                                                                                                                                                                                                   |
| QR codes                 | N/A for QR rendering changes: none in this ticket. Existing MFA QR decode checks pass; physical authenticator scan remains NOT VERIFIED.                                                                                                                                                                                                                     |
| Staff feedback           | PASS for placeholder typography, labelled destinations and keyboard navigation; scanner sound/vibration is N/A until scanner implementation.                                                                                                                                                                                                                 |
| Verification             | Standard full verification passed584 units/26 skipped and731 browser cases/153 skipped. Subsequent test-only expansion passes six cases and quick verification. Separate cold-font regression FAILS; it is not included by the standard @smoke filter.                                                                                                       |

Review evidence remains on PR68. A preview-only exception is pending; no approval, production readiness or completion is inferred.

## Preview exception approved — 2026-11-01

The owner approved “Advance preview; retain exact-zero release gate.” Previous FAIL and NOT VERIFIED results above remain accurate; this authorizes a labelled navigation preview after remaining integration checks, not production UI approval. TICKET-201 retains mandatory exact-zero CLS, performance and physical-device checks before guest release. Develop integration now requires fresh metadata/sharing and navigation verification; prior screenshots cover unchanged components but do not certify new metadata behavior.

## Integrated preview review — 2026-11-01

Base develop99be217ae101133995e63af416ef6dc66f1f39fa; integration commit e799d1e. Rebuilt authenticated journey passes (integrated-journey.log,1 case,10s), including authorization, actual-link crawl and offline fallback. Sharing browser smoke passes2 cases with unchanged assertions. Metadata/artwork tests pass4 cases, including custom saved names/date and exclusion of extra private fields.

All four production PNG responses for current default settings are byte-identical to previously reviewed docs/reviews/TICKET-047/{theme}.png. SHA256: ivory43dffdcad7f6a99e37cc34e24007ef9324f46e9718b13cfc84d65a117754209e; midnightf876aadba735a0c8eb35c1c1cdc97e5c3356716918c2c1fc486a2bce06cde70b; emeraldfbc28a78be61d9ef0822156b495884145dfa6651dd182b454d511619609b46e1; blush43eb4d5fcd3bc7c9738d5a7e4398c2d3aa787cd5b3ff6f4813bff4ba672b89a5. The settings integration does not change their reviewed layout.

Preview review: APPROVE subject to the final full verification/CI gates and the owner's explicit exception. Production UI review remains CHANGES REQUESTED for the existing exact-zero font-shift and unverified physical-device requirements; TICKET-201 remains release-blocking. No failed assertion, screenshot or measurement is removed.
