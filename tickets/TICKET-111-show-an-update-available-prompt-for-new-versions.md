---
id: TICKET-111
title: Show an update-available prompt for new versions
epic: pwa
status: todo
priority: high
estimate: L
labels: [pwa, frontend]
module: shared
owner: ""
agent: ""
blocked_by: [TICKET-105, TICKET-066]
blocks: [TICKET-113, TICKET-154]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-111: Show an update-available prompt for new versions

## Context

Staff devices must pick up fixes on the day without losing queued check-ins.

See: [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture).

## Scope

- Detect a waiting worker; toast with Reload; never auto-reload while the offline queue is non-empty.
- Merged from TICKET-180 (Preserve queued events across worker and data upgrades):
  - Test worker and IndexedDB upgrades while admissions remain unsynced.

## Out of scope

- Forced updates.

## Acceptance criteria

- [ ] A new build triggers the prompt (e2e with two builds or simulated waiting worker).
- [ ] Reload is blocked while check-ins are pending (unit).

- [ ] Use TICKET-180 queue-safe activation; defer updates while scans are pending and preserve events across multiple tabs and worker/schema changes.
- [ ] (from TICKET-180) A version N queue survives installation of N+1, reload, tab closure and schema migration with stable event ids and no missing or duplicate events.
- [ ] (from TICKET-180) Update prompt defers activation until queued events are acknowledged or the approved safe migration path is confirmed; multiple tabs show a coherent pending state.
- [ ] (from TICKET-180) Old/new client compatibility and rollback are explicit; incompatible migrations fail safely without clearing queues or caches containing the only copy of events.

## Test plan

- Unit: Update guard.
- End-to-end: Update flow.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: End-to-end: actual N/N+1 workers with unsynced events, decline/accept update and interrupted reload.
- (TICKET-180) End-to-end: serve two actual worker versions, queue offline scans, upgrade/reload/reconnect and compare persisted ids to server acknowledgements. Repeat with interrupted migration and an older app version.

## Files likely touched

- `src/modules/shared/components/`

## Notes / decisions

_Agents append dated notes here while working._
- 2026-11-12 (unclechenna, claude): TICKET-228 merged TICKET-180 into this ticket (all unstarted) to cut per-ticket overhead. Their scope, criteria and dependencies are above; the merged tickets are cancelled.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
