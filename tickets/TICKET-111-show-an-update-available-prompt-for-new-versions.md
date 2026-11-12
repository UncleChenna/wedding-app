---
id: TICKET-111
title: Show an update-available prompt for new versions
epic: pwa
status: todo
priority: high
estimate: M
labels: [pwa, frontend]
module: shared
owner: ""
agent: ""
blocked_by: [TICKET-105, TICKET-066, TICKET-180]
blocks: [TICKET-113]
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

## Out of scope

- Forced updates.

## Acceptance criteria

- [ ] A new build triggers the prompt (e2e with two builds or simulated waiting worker).
- [ ] Reload is blocked while check-ins are pending (unit).

- [ ] Use TICKET-180 queue-safe activation; defer updates while scans are pending and preserve events across multiple tabs and worker/schema changes.

## Test plan

- Unit: Update guard.
- End-to-end: Update flow.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: End-to-end: actual N/N+1 workers with unsynced events, decline/accept update and interrupted reload.

## Files likely touched

- `src/modules/shared/components/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
