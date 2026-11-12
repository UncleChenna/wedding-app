---
id: TICKET-066
title: Queue offline check-ins and sync them when signal returns
epic: checkin
status: in_progress
priority: high
estimate: M
labels: [frontend, backend, pwa]
module: checkin
owner: divine
agent: codex
blocked_by: [TICKET-065, TICKET-173, TICKET-062]
blocks: [TICKET-067, TICKET-111, TICKET-129, TICKET-136, TICKET-143, TICKET-180]
branch: TICKET-066
pr: https://github.com/UncleChenna/wedding-app/pull/164
created: 2026-10-21
updated: 2026-11-12
started: 2026-11-12
completed: ""
reason: ""
resume_to: ""
---

# TICKET-066: Queue offline check-ins and sync them when signal returns

## Context

Check-ins made offline are queued and synced on reconnect; double entries across devices are flagged.

See: [Gate check-in](../docs/prd.md#gate-check-in) (CHK-6) · [Security](../docs/prd.md#security).

## Scope

- Client IndexedDB queue, durable event ids, retry/backoff and visible pending count. The server merge is TICKET-173; conflict UI is TICKET-067.

## Out of scope

- Conflict resolution UI (TICKET-067).

## Acceptance criteria

- [x] Persist every offline scan attempt transactionally before reporting an admission as recorded; quota/write failure shows a recovery state.
- [x] Ten offline admissions survive reload and sync exactly once after repeated reconnects, using TICKET-173 per-event acknowledgements.
- [x] Foreground and manual retry work on Safari without Background Sync; failures remain queued with visible pending count.
- [x] Invalid, used and revoked attempts are logged as well as successful admissions; pending count clears only after committed acknowledgement.

## Test plan

- Unit: Queue and merge logic.
- End-to-end: Offline → online sync.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/checkin/lib/sync.ts`
- `src/modules/checkin/server/sync.ts`

## Notes / decisions

2026-11-12: Durable worker-owned queue, authenticated actor binding, manual/QR count confirmation and immutable replay digest implemented. Actual product2/2, snapshot compatibility2/2, manual recovery2/2, Chromium/WebKit worker/store18/18 and isolated reconciliation13/13 pass. See docs/reviews/TICKET-066/queue-contract.md and migration-review.md. Physical-device and initial-wire performance release gates remain mandatory; final hosted CI must pass before merge.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-12 — todo → claimed — divine (codex)
- 2026-11-12 — todo → in_progress — divine (codex)
- 2026-11-12 — in_progress → in_review — divine (codex)
- 2026-11-12 — in_review → in_progress — divine (codex) — Final CI exposed an uncached first-use decoder chunk, missing defensive observation coverage, and a background-revocation fixture race; repairing without weakening gates.
