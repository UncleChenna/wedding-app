---
id: TICKET-238
title: Serialize camera reads while a scan response is pending
epic: quality
status: in_review
priority: high
estimate: S
labels: [test]
module: checkin
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-238
pr: https://github.com/UncleChenna/wedding-app/pull/194
created: 2026-11-13
updated: 2026-11-13
started: 2026-11-13
completed: ""
reason: ""
resume_to: ""
---

# TICKET-238: Serialize camera reads while a scan response is pending

## Context

TICKET-118's extended real camera audit observed two zero-admission not_rsvped events for one displayed check under a slow response. Camera throttling expires after three seconds, while Scanner.check aborts an earlier request and starts another. The first server operation may already have appended its observation. See [Gate check-in](../docs/prd.md#gate-check-in).

## Scope

- Serialize camera reads for a capture session while the current result is pending.
- Preserve explicit pause, unmount, fresh-scan and stale-response fencing.
- Keep the exact-one observation regression and add delayed-response proof.

## Out of scope

- Changing admission authorization, immutable event schemas, throttle interval or observation meaning.

## Acceptance criteria

- [x] Repeated decode callbacks during one pending read issue exactly one resolver request and do not abort it.
- [x] Explicit stop/unmount still cancels; a new capture can read again; stale responses cannot overwrite a newer scan.
- [x] Actual signed camera check delayed beyond three seconds records exactly one zero-admission observation and no admission.
- [x] TICKET-154 lists this repair as a release prerequisite; original gate assertions remain intact.

## Test plan

- Unit: deferred resolver and repeated callbacks, stop/restart and stale resolution.
- Browser: synthetic signed QR with response delayed beyond camera suppression; count immutable events and ensure no admission.
- Focused verification and required CI.

## Files likely touched

- src/modules/checkin/components/scanner.tsx
- src/modules/checkin/__tests__/scanner.test.tsx
- e2e/gate.spec.ts
- tickets/TICKET-154-release-to-production-and-confirm-the-site-insta.md

## Notes / decisions

- 2026-11-13: Deferred unit reproduces3reads before repair, then16 focused scanner/live-update tests pass. Production build and two actual delayed signed-camera browser cases pass (18.0s), retaining exact-one observations and no-admission assertions. Explicit pause/reopen is now required to replace a pending capture; stale-response test retains its original assertions with that real interaction.

- 2026-11-13: The quiet TICKET-118 rerun passes; this does not erase the earlier duplicate observation. Repair the overlap deterministically rather than loosening counts or raising timeouts.

## Activity log

- 2026-11-13 — new → todo — divine (codex)
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
- 2026-11-13 — in_progress → in_review — divine (codex)
