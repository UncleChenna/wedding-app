---
id: TICKET-143
title: Build the admin health page
epic: observability
status: todo
priority: medium
estimate: M
labels: [frontend, backend]
module: admin
owner: ""
agent: ""
blocked_by: [TICKET-066, TICKET-084, TICKET-088]
blocks: [TICKET-142, TICKET-161]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-143: Build the admin health page

## Context

On the day, one screen should show DB, realtime, alert outbox, pending syncs and the deployed version.

See: [Performance and reliability](../docs/prd.md#performance-and-reliability).

## Scope

- /admin/health and a minimal public /api/health (no data).

## Out of scope

- Metrics dashboards.

## Acceptance criteria

- [ ] Health shows each dependency's state; a stopped DB shows red with text (e2e with a stub).
- [ ] /api/health reveals no internal details.

## Test plan

- Unit: Health checks.
- End-to-end: Health page.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/(admin)/admin/health/`
- `src/app/api/health/route.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
