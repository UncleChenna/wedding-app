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

- [ ] TICKET-109: resolve and remeasure /dev/invitation mobile performance (integrated production runs90/92/90; accessibility100 and CLS0 each). Preserve docs/reviews/TICKET-109/integrated-performance-{1,2,3}.json and the95 release target. Verify real Android/Chrome install eligibility, explicit native prompt, dismissal and standalone launch, plus WhatsApp behavior; record build/device/browser versions and evidence. TICKET-114 retains the full PWA installation suite.

- [ ] TICKET-104: install from the HTTPS release candidate on physical iOS and Android; capture the generated UA home-screen icon (not a page screenshot), maskable bounds and supported startup artwork. Record device/OS/browser, build, active theme, screenshots and actual results. Test every shipped preset; link and retest any defects. Reuse this evidence in TICKET-114's full PWA installation suite. This requirement blocks both guest releases even while preview delivery proceeds.

- [ ] TICKET-037: resolve and remeasure personal-invitation performance variability (serial baseline94/98/95, median95), preserving all results and the at-least95 release target. See docs/reviews/TICKET-037/performance-idle.json.

- [ ] TICKET-037: verify the personal invitation and configured venue map on physical iOS and Android, including WhatsApp navigation and native map handoff; record exact devices/app versions and actual destinations.

- [ ] Every release-bound guest route scores at least 95 Performance and Accessibility on Lighthouse mobile; record three runs and their range/median per route and build.
- [ ] CLS is zero on measured page loads; any device-specific differences have reproduced evidence and fixes.
- [ ] Actual iOS and Android WhatsApp navigation, forms, keyboards and primary actions pass; device/app versions and dates are recorded.
- [ ] Shared links display the correct 1200x630 preview without invitation secrets or guest details.
- [ ] Each affected UI review is updated with actual evidence; unresolved checks prevent guest release, while labelled preview work may continue.

## Test plan

- End-to-end: production-build Lighthouse, keyboard/axe and 375/768/1280 screenshot matrix in both themes.
- Manual: physical iOS and Android WhatsApp sharing and in-app flows; include back/forward, keyboard appearance, long names and confirmation states.
- Unit: regression coverage for any performance or functional fix that introduces logic. Run pnpm verify for code changes.

## Files likely touched

- docs/reviews/, affected feature components and e2e tests; keep code repairs scoped or split them.

## Notes / decisions

- 2026-11-01: TICKET-109 preview delivery uses the owner's standing device/performance-QA separation approval. Below-target measurements and native installation remain unverified release requirements; neither release dependency changes.

- 2026-11-01: TICKET-104's unverified installed-icon requirement is retained here under the owner's preview/device-QA separation approval. Automated icon metadata and safe-zone checks do not certify physical installation. Neither release dependency is removed.

- 2026-10-31: Owner separately approved TICKET-037 proceeding to review with its remaining performance variability tracked here. The95 release target and raw measurements are unchanged; this is not a performance pass.

- 2026-10-31: Owner approved TICKET-037 proceeding to review while physical WhatsApp and native-map checks remain mandatory here. This is a release gate, not evidence those checks passed.

- Explicit user approval: "Merge previews; track remaining QA separately". Human label reflects required physical-device participation. No real-device result has been claimed yet.

## Activity log

- 2026-10-26 — new → todo — divine
