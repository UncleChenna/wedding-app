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

- Explicit user approval: "Merge previews; track remaining QA separately". Human label reflects required physical-device participation. No real-device result has been claimed yet.

## Activity log

- 2026-10-26 — new → todo — divine
