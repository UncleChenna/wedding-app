## Summary

The existing gate journey checked Valid and Invalid through camera pixels, but Already used, Revoked and Not RSVP’d only through direct authenticated HTTP calls. A new browser case sends real synthetic QR frames through the scanner and verifies all five displayed results and their persisted read-only observations. No application behavior changes.

## Acceptance criteria and evidence

- [x] All five result types: `e2e/gate.spec.ts` signs synthetic passes, supplies canvas camera frames, signs in through the real PIN form and checks each visible heading. It also proves the camera tracks stop and non-valid results offer no admission action.
- [x] Scanning alone never admits anyone: each outcome writes exactly one online QR observation with zero admitted people, attributed to the registered browser device. Only the pre-existing Already used fixture has admitted people.
- [x] Partial admission and manual search remain covered by unchanged `online-admission.spec.ts` and `manual-checkin.spec.ts`, including a lost committed response, exact retry, competing admission and companion-name lookup after denied camera permission.
- The existing CI admission runner now includes the new matrix on mobile and desktop. Hosted CI must pass before merge.

## Verification

- Production build and typecheck pass.
- `scripts/test-online-admission.ts`: all six browser cases pass in 1.2 minutes against this ticket's isolated, fully migrated PostgreSQL. New matrix: 3.3 seconds mobile, 2.5 seconds desktop.
- New outcome screenshots: `docs/reviews/TICKET-132/{mobile,desktop}/{valid,already_used,invalid,revoked,not_rsvped}.png`.
- Synthetic private dietary/RSVP markers never appear in page HTML. Tests disable traces/video and automatic failure screenshots to avoid publishing pass credentials.
- Fixtures preserve immutable scan evidence and retire their staff/device credentials. No production database, collaborator database or audit guard is modified.
- Quick verification passes lint and types; no related unit files are selected for the runner-only change. Independent source review found no blockers. Mobile outcome screenshots were inspected. The existing offline-recovery notice remains visible during the online-only fixture; offline health is outside this ticket.

## Risks and rollout

This is browser regression coverage, not physical camera or venue-network certification. Native local PostgreSQL verifies real application HTTP/database behavior; this ticket makes no Realtime transport claim. Existing physical-device release gates remain mandatory.

No new CI job, service, secret, environment flag, dependency or production code. The existing ephemeral signing-key runner supplies credentials. Rollback removes the new test from that runner; keep the existing partial/manual tests intact.
