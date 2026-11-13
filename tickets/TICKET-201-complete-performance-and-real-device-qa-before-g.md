---
id: TICKET-201
title: Complete performance and real-device QA before guest release
epic: invitations
status: todo
priority: high
estimate: M
labels: [frontend, design, human]
module: invitations
owner: ""
agent: ""
blocked_by: []
blocks: [TICKET-154, TICKET-176]
branch: ""
pr: ""
created: 2026-10-26
updated: 2026-10-26
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-201: Complete performance and real-device QA before guest release

## Context

On 26 October 2026 the user approved merging labelled previews while tracking remaining performance and WhatsApp/device QA separately. This exception allows frontend preview delivery; it does not certify production guest readiness. Baseline evidence: docs/reviews/TICKET-198.md and TICKET-198-performance.json.

## Scope

- Verify real saved RSVP yes/no replies on physical iOS and Android, in WhatsApp and native browsers: confirmation, reload persistence, back/forward, keyboard, tampered/revoked links and native submission with scripts disabled where supported. Use synthetic invitations and record build/device/browser versions.

- Resolve inconsistent Lighthouse mobile performance on home and invitation preview (latest 92 and 94 versus target 95; guidance 96).
- Measure affected guest pages and completed preview flows on production builds with repeatable conditions; preserve raw results and layout-shift evidence.
- Check public Open Graph previews and navigation/forms inside WhatsApp on physical iOS and Android devices; log device, OS, app version, route and results.
- Recheck upcoming RSVP and ordering previews before their production integration is released to guests. Add separate defects if repairs exceed this ticket's M scope.

## Out of scope

Claiming untested checks pass, weakening thresholds, changing TICKET-015's paused status, or treating preview responses as saved guest records.

## Acceptance criteria

- [ ] TICKET-117: complete guest accessibility sign-off on physical iOS VoiceOver and Android TalkBack, including invitation reading order, saved RSVP announcements, companion add/remove, issued pass/save controls and table ordering. Verify actual browser200% zoom, software keyboard and WhatsApp behavior. Record device/OS/browser/build and findings/retests in docs/audits/TICKET-117-guest-accessibility.md; automated axe, text-size emulation and keyboard checks do not certify these requirements. Preserve both release gates until all applicable A/AA findings are resolved.
- [ ] TICKET-118: verify gate verdicts and admission identifiers, kitchen/bar boards and staff order dialogs at arm’s length on actual event devices in every shipped theme; record device/OS/browser/build and venue lighting. Verify admin keyboard, VoiceOver/TalkBack and software-keyboard operation on actual phones. Automated Chromium font/axe/keyboard evidence is not a physical-device pass.

- [ ] TICKET-111: on actual event phones/tablets verify waiting-update notifications, Later, queue-blocked Reload and explicit safe reload across tabs; retain saved attempts through interruption. Record OS/browser/build. Fresh guest-page Lighthouse and layout-shift measurements remain required before release; automated preview evidence does not certify these checks.

- [ ] TICKET-076: verify kitchen and shared bar boards are legible at one metre on the actual event tablets, in every shipped theme and realistic venue lighting. Check table numbers, item quantities, notes, age and status controls; record device/model/OS/browser/build, distance and actual outcomes. Also confirm new-order visual feedback and unlocked audio on those devices. The original manual criterion remains unperformed; this transfer permits preview completion only and continues to block both TICKET-154 and TICKET-176.

- [ ] TICKET-063: Results are readable at arm's length (≥18px). Verify manual primary/tag-along search, denied-camera recovery, keyboard focus, uncertain admission retry and offline read-only warnings on physical gate phones/tablets in all shipped themes. Record device/OS/browser/build and actual results; browser emulation does not certify physical readability. This remains mandatory and release-blocking under the approved preview exception.

- [ ] TICKET-166: On physical iOS and Android, verify the admin event-closure form's keyboard, safe areas, focus visibility and confirmation controls; download and open the anonymous memories CSV/PDF in native viewers and check long-menu pagination. Use synthetic events only, retain pending admission evidence, and record device/OS/browser/build and actual results. These checks remain release-blocking under the owner's preview exception; automated emulation does not certify them. Production closure still requires approved event timing and operator confirmation.

- [ ] TICKET-107: on physical iOS and Android, including WhatsApp and installed standalone mode, open an accepted invitation once, confirm the saved hint, disable connectivity and reopen the original link. Decode the saved QR, verify guest-link isolation, last-refresh warning, reconnect revocation/decline cleanup and storage-eviction behavior. Record device/OS/app/build versions and results. TICKET-184 expiry/logout checks remain mandatory; desktop emulation does not certify these requirements. Both releases remain blocked by unresolved results.

- [ ] TICKET-044: on physical iOS and Android, scan the issued signed QR from both screens and printed copies in normal light, low light and glare. Record device/OS/camera/browser/build, realistic payload length and actual results. Verify WhatsApp first/return visits, keyboard/safe areas, and that the scanned read-only pass cannot edit an RSVP. This remains mandatory before either guest release; automated decoding and desktop emulation do not certify it.

- [ ] TICKET-110: on physical iPhone/iPad browsers, including WhatsApp, verify the guide explains opening in Safari, complete Share → Add to Home Screen with actual OS menus, and confirm the installed standalone app hides guidance. Record device/OS/WhatsApp/browser/build and screenshots, keyboard/safe-area behavior and any defects. Browser UA fixtures do not certify this. Retain TICKET-114's full installation suite; unresolved results block both guest releases.

- [ ] TICKET-109: resolve and remeasure /dev/invitation mobile performance (integrated production runs90/92/90; accessibility100 and CLS0 each). Preserve docs/reviews/TICKET-109/integrated-performance-{1,2,3}.json and the95 release target. Verify real Android/Chrome install eligibility, explicit native prompt, dismissal and standalone launch, plus WhatsApp behavior; record build/device/browser versions and evidence. TICKET-114 retains the full PWA installation suite.

- [ ] TICKET-104: install from the HTTPS release candidate on physical iOS and Android; capture the generated UA home-screen icon (not a page screenshot), maskable bounds and supported startup artwork. Record device/OS/browser, build, active theme, screenshots and actual results. Test every shipped preset; link and retest any defects. Reuse this evidence in TICKET-114's full PWA installation suite. This requirement blocks both guest releases even while preview delivery proceeds.

- [ ] TICKET-037: resolve and remeasure personal-invitation performance variability (serial baseline94/98/95, median95), preserving all results and the at-least95 release target. See docs/reviews/TICKET-037/performance-idle.json.

- [ ] TICKET-037: verify the personal invitation and configured venue map on physical iOS and Android, including WhatsApp navigation and native map handoff; record exact devices/app versions and actual destinations.

- [ ] Every release-bound guest route scores at least 95 Performance and Accessibility on Lighthouse mobile; record three runs and their range/median per route and build.
- [ ] CLS is zero on measured page loads; any device-specific differences have reproduced evidence and fixes.
- [ ] Actual iOS and Android WhatsApp navigation, forms, keyboards and primary actions pass; device/app versions and dates are recorded.
- [ ] Shared links display the correct 1200x630 preview without invitation secrets or guest details.
- [ ] Each affected UI review is updated with actual evidence; unresolved checks prevent guest release, while labelled preview work may continue.

- [ ] TICKET-045: Download works on iOS Safari and Android Chrome (manual, recorded). Also test WhatsApp in-app save/open-image/hold-to-save and file sharing, cancellation, dark/light appearance, long and non-Latin names, and physical camera decoding of the saved PNG. Record device/OS/browser/WhatsApp/build and results. Missing local-font glyphs must never leak names to remote services; verify fallback advice. Unverified or failed results continue to block both guest releases.

- [ ] TICKET-031: verify staff PIN entry on physical iOS and Android phones/tablets at /checkin, /kitchen and /bar. Record device/OS/browser/build, numeric keyboard behavior, safe areas, focus and readable errors; exercise wrong PIN, expiry, lockout, sign-out and role isolation. Keep failures or missing evidence release-blocking. Owner approved review deferral on 2026-11-04; automated browser evidence does not certify physical devices.

## Test plan

- End-to-end: production-build Lighthouse, keyboard/axe and 375/768/1280 screenshot matrix in both themes.
- Manual: physical iOS and Android WhatsApp sharing and in-app flows; include back/forward, keyboard appearance, long names and confirmation states.
- Unit: regression coverage for any performance or functional fix that introduces logic. Run pnpm verify for code changes.

## Files likely touched

- docs/reviews/, affected feature components and e2e tests; keep code repairs scoped or split them.

## Notes / decisions

- 2026-11-12 — TICKET-232 retains TICKET-076’s physical one-metre board check here under the owner’s standing manual-QA disposition. It remains unchecked and mandatory before release.

- 2026-11-01: Retained110's physical iPhone/WhatsApp requirement here under the owner's existing preview delivery exception. The manual check remains unchecked; no release dependency or performance requirement is removed.

- 2026-11-01: TICKET-109 preview delivery uses the owner's standing device/performance-QA separation approval. Below-target measurements and native installation remain unverified release requirements; neither release dependency changes.

- 2026-11-01: TICKET-104's unverified installed-icon requirement is retained here under the owner's preview/device-QA separation approval. Automated icon metadata and safe-zone checks do not certify physical installation. Neither release dependency is removed.

- 2026-10-31: Owner separately approved TICKET-037 proceeding to review with its remaining performance variability tracked here. The95 release target and raw measurements are unchanged; this is not a performance pass.

- 2026-10-31: Owner approved TICKET-037 proceeding to review while physical WhatsApp and native-map checks remain mandatory here. This is a release gate, not evidence those checks passed.

- Explicit user approval: "Merge previews; track remaining QA separately". Human label reflects required physical-device participation. No real-device result has been claimed yet.

## Activity log

- 2026-10-26 — new → todo — divine
