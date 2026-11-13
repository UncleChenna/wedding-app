---
id: TICKET-114
title: Test installation on real Android and iOS devices
epic: pwa
status: todo
priority: high
estimate: L
labels: [human, pwa, test]
module: ops
owner: ""
agent: ""
blocked_by: [TICKET-113, TICKET-149, TICKET-055, TICKET-057, TICKET-044, TICKET-047, TICKET-045, TICKET-107, TICKET-041, TICKET-039]
blocks: [TICKET-154, TICKET-163, TICKET-159, TICKET-176]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-114: Test installation on real Android and iOS devices

## Context

Emulation does not prove install, icons, splash screens or offline behaviour on real phones.

See: [Usability and accessibility](../docs/prd.md#usability-and-accessibility) · [What "flawless" means in testing](../docs/prd.md#what-flawless-means-in-testing).

## Scope

- Install from the production URL on one iPhone and one Android; check icon, splash, offline pass and scanner.
- Merged from TICKET-138 (Test the guest flow in WhatsApp's browser on iOS and Android):
  - From a real WhatsApp message: preview, IV, RSVP, tag-alongs, pass save, offline reopen, on one iPhone and one Android.
- Merged from TICKET-201 (Complete performance and real-device QA before guest release):
  - Verify real saved RSVP yes/no replies on physical iOS and Android, in WhatsApp and native browsers: confirmation, reload persistence, back/forward, keyboard, tampered/revoked links and native submission with scripts disabled where supported. Use synthetic invitations and record build/device/browser versions.
  - Resolve inconsistent Lighthouse mobile performance on home and invitation preview (latest 92 and 94 versus target 95; guidance 96).
  - Measure affected guest pages and completed preview flows on production builds with repeatable conditions; preserve raw results and layout-shift evidence.
  - Check public Open Graph previews and navigation/forms inside WhatsApp on physical iOS and Android devices; log device, OS, app version, route and results.
  - Recheck upcoming RSVP and ordering previews before their production integration is released to guests. Add separate defects if repairs exceed this ticket's M scope.
- Merged from TICKET-206 (Verify admin MFA on physical iOS and Android before release):

## Out of scope

- Automated implementation evidence (TICKET-057 and TICKET-113); it does not satisfy these physical-device checks.

## Acceptance criteria

- [ ] Device models, OS versions and results recorded in notes with screenshots.
- [ ] Any failure has a linked fix-up ticket.

- [ ] Run on the staging HTTPS deployment before full production release. Any required-device failure blocks sign-off until fixed and retested.

- [ ] Verification of one token takes <20ms on a mid-range Android (manual timing).
- [ ] Verify signatures and expiry using realistic payload lengths on the physical device set; no private signing key ships to a browser or cache.

- [ ] Record physical device/model/OS/browser/build, realistic payload lengths, signature/expiry results and measured token timings. Test the actual scanner device set from TICKET-055, including a mid-range Android and an iPhone; failures or missing evidence block release sign-off.
- [ ] (from TICKET-138) Device/OS/WhatsApp versions and pass/fail per step recorded with screenshots.
- [ ] (from TICKET-138) Every failure has a fix-up ticket.
- [ ] (from TICKET-138) Run real iOS and Android WhatsApp link/preview/share/save-pass journeys against staging before TICKET-176; failures require fixes and retest. Do not wait for full wedding-day deployment.
- [ ] (from TICKET-201) TICKET-166: On physical iOS and Android, verify the admin event-closure form's keyboard, safe areas, focus visibility and confirmation controls; download and open the anonymous memories CSV/PDF in native viewers and check long-menu pagination. Use synthetic events only, retain pending admission evidence, and record device/OS/browser/build and actual results. These checks remain release-blocking under the owner's preview exception; automated emulation does not certify them. Production closure still requires approved event timing and operator confirmation.
- [ ] (from TICKET-201) TICKET-107: on physical iOS and Android, including WhatsApp and installed standalone mode, open an accepted invitation once, confirm the saved hint, disable connectivity and reopen the original link. Decode the saved QR, verify guest-link isolation, last-refresh warning, reconnect revocation/decline cleanup and storage-eviction behavior. Record device/OS/app/build versions and results. TICKET-184 expiry/logout checks remain mandatory; desktop emulation does not certify these requirements. Both releases remain blocked by unresolved results.
- [ ] (from TICKET-201) TICKET-044: on physical iOS and Android, scan the issued signed QR from both screens and printed copies in normal light, low light and glare. Record device/OS/camera/browser/build, realistic payload length and actual results. Verify WhatsApp first/return visits, keyboard/safe areas, and that the scanned read-only pass cannot edit an RSVP. This remains mandatory before either guest release; automated decoding and desktop emulation do not certify it.
- [ ] (from TICKET-201) TICKET-110: on physical iPhone/iPad browsers, including WhatsApp, verify the guide explains opening in Safari, complete Share → Add to Home Screen with actual OS menus, and confirm the installed standalone app hides guidance. Record device/OS/WhatsApp/browser/build and screenshots, keyboard/safe-area behavior and any defects. Browser UA fixtures do not certify this. Retain TICKET-114's full installation suite; unresolved results block both guest releases.
- [ ] (from TICKET-201) TICKET-109: resolve and remeasure /dev/invitation mobile performance (integrated production runs90/92/90; accessibility100 and CLS0 each). Preserve docs/reviews/TICKET-109/integrated-performance-{1,2,3}.json and the95 release target. Verify real Android/Chrome install eligibility, explicit native prompt, dismissal and standalone launch, plus WhatsApp behavior; record build/device/browser versions and evidence. TICKET-114 retains the full PWA installation suite.
- [ ] (from TICKET-201) TICKET-104: install from the HTTPS release candidate on physical iOS and Android; capture the generated UA home-screen icon (not a page screenshot), maskable bounds and supported startup artwork. Record device/OS/browser, build, active theme, screenshots and actual results. Test every shipped preset; link and retest any defects. Reuse this evidence in TICKET-114's full PWA installation suite. This requirement blocks both guest releases even while preview delivery proceeds.
- [ ] (from TICKET-201) TICKET-037: resolve and remeasure personal-invitation performance variability (serial baseline94/98/95, median95), preserving all results and the at-least95 release target. See docs/reviews/TICKET-037/performance-idle.json.
- [ ] (from TICKET-201) TICKET-037: verify the personal invitation and configured venue map on physical iOS and Android, including WhatsApp navigation and native map handoff; record exact devices/app versions and actual destinations.
- [ ] (from TICKET-201) Every release-bound guest route scores at least 95 Performance and Accessibility on Lighthouse mobile; record three runs and their range/median per route and build.
- [ ] (from TICKET-201) CLS is zero on measured page loads; any device-specific differences have reproduced evidence and fixes.
- [ ] (from TICKET-201) Actual iOS and Android WhatsApp navigation, forms, keyboards and primary actions pass; device/app versions and dates are recorded.
- [ ] (from TICKET-201) Shared links display the correct 1200x630 preview without invitation secrets or guest details.
- [ ] (from TICKET-201) Each affected UI review is updated with actual evidence; unresolved checks prevent guest release, while labelled preview work may continue.
- [ ] (from TICKET-201) TICKET-045: Download works on iOS Safari and Android Chrome (manual, recorded). Also test WhatsApp in-app save/open-image/hold-to-save and file sharing, cancellation, dark/light appearance, long and non-Latin names, and physical camera decoding of the saved PNG. Record device/OS/browser/WhatsApp/build and results. Missing local-font glyphs must never leak names to remote services; verify fallback advice. Unverified or failed results continue to block both guest releases.
- [ ] (from TICKET-201) TICKET-031: verify staff PIN entry on physical iOS and Android phones/tablets at /checkin, /kitchen and /bar. Record device/OS/browser/build, numeric keyboard behavior, safe areas, focus and readable errors; exercise wrong PIN, expiry, lockout, sign-out and role isolation. Keep failures or missing evidence release-blocking. Owner approved review deferral on 2026-11-04; automated browser evidence does not certify physical devices.
- [ ] (from TICKET-206) On each physical platform, scan the rendered enrolment QR with an authenticator and successfully verify a generated code; no secrets are retained in evidence.
- [ ] (from TICKET-206) Manual-key fallback and returning sign-in succeed on both platforms; incorrect/expired codes remain rejected.
- [ ] (from TICKET-206) Native keyboards leave inputs, errors and submit actions visible and operable; focus and 44px targets are checked.
- [ ] (from TICKET-206) All four themes preserve readable instructions and scannable QR output on both platforms.
- [ ] (from TICKET-206) Update TICKET-030's UI review with device/build evidence; unresolved failures block production releases TICKET-176 and TICKET-154.

## Test plan

- Manual: Real devices.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: record real iOS/Android device results for guidance, installation, standalone offline launches and safe update.
- (TICKET-138) Manual: Real devices.
- (TICKET-138) Audit verification: Manual: record app/OS/browser versions, approved wording, QR image save and link behavior without private guest screenshots.
- (TICKET-201) End-to-end: production-build Lighthouse, keyboard/axe and 375/768/1280 screenshot matrix in both themes.
- (TICKET-201) Manual: physical iOS and Android WhatsApp sharing and in-app flows; include back/forward, keyboard appearance, long names and confirmation states.
- (TICKET-201) Unit: regression coverage for any performance or functional fix that introduces logic. Run pnpm verify for code changes.

## Files likely touched

- `docs/runbook.md`

## Notes / decisions

- 2026-11-09 (TICKET-220): The two physical token-verification criteria above are transferred verbatim from TICKET-057. The <20ms measurement remains a required hardware check, not a desktop timing claim. TICKET-055 remains a prerequisite; TICKET-154 and TICKET-163 remain blocked until these checks pass.

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.
- 2026-11-12 (unclechenna, claude): TICKET-228 merged TICKET-138, TICKET-201, TICKET-206 into this ticket (all unstarted) to cut per-ticket overhead. Their scope, criteria and dependencies are above; the merged tickets are cancelled.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
