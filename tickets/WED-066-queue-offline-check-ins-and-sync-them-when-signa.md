---
id: WED-066
title: Queue offline check-ins and sync them when signal returns
epic: checkin
status: todo
priority: urgent
estimate: L
labels: [frontend, backend, pwa]
module: checkin
owner: ""
agent: ""
blocked_by: [WED-065]
blocks: [WED-067, WED-129, WED-136, WED-143, WED-154]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-066: Queue offline check-ins and sync them when signal returns

## Context

Check-ins made offline are queued and synced on reconnect; double entries across devices are flagged.

See: [Gate check-in](../docs/prd.md#gate-check-in) (CHK-6) · [Security](../docs/prd.md#security).

## Scope

- Persistent queue with client_event_id; retry with backoff; Background Sync where supported.
- Server merge that is idempotent and reports conflicts.
- Visible pending count.

## Out of scope

- Conflict resolution UI (WED-067).

## Acceptance criteria

- [ ] Ten offline admissions sync exactly once after reconnect, even if sync runs twice (e2e).
- [ ] A reload while offline keeps the queue.
- [ ] Pending count returns to 0 after a successful sync.

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
