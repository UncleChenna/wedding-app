---
id: TICKET-066
title: Queue offline check-ins and sync them when signal returns
epic: checkin
status: todo
priority: high
estimate: M
labels: [frontend, backend, pwa]
module: checkin
owner: ""
agent: ""
blocked_by: [TICKET-065, TICKET-173, TICKET-062]
blocks: [TICKET-067, TICKET-111, TICKET-129, TICKET-136, TICKET-143, TICKET-180]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
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

- [ ] Persist every offline scan attempt transactionally before reporting an admission as recorded; quota/write failure shows a recovery state.
- [ ] Ten offline admissions survive reload and sync exactly once after repeated reconnects, using TICKET-173 per-event acknowledgements.
- [ ] Foreground and manual retry work on Safari without Background Sync; failures remain queued with visible pending count.
- [ ] Invalid, used and revoked attempts are logged as well as successful admissions; pending count clears only after committed acknowledgement.

## Test plan

- Unit: Queue and merge logic.
- End-to-end: Offline → online sync.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/checkin/lib/sync.ts`
- `src/modules/checkin/server/sync.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
