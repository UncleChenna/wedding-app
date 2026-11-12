---
id: TICKET-143
title: Build the admin health page
epic: observability
status: in_progress
priority: medium
estimate: M
labels: [frontend, backend]
module: admin
owner: divine
agent: codex
blocked_by: [TICKET-066, TICKET-084, TICKET-088]
blocks: [TICKET-142, TICKET-161]
branch: TICKET-143
pr: ""
created: 2026-10-21
updated: 2026-11-12
started: 2026-11-12
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

- [x] Health shows each dependency's state; a stopped DB shows red with text (e2e with a stub).
- [x] /api/health reveals no internal details.

## Test plan

- Unit: Health checks.
- End-to-end: Health page.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/(admin)/admin/health/`
- `src/app/api/health/route.ts`

## Notes / decisions

- 2026-11-12 — Added authenticated event health, bounded public readiness, honest unknown offline queues and realtime capability reporting. Focused verification: 134 related tests, 13 health tests, production build and both authenticated browser projects pass. Evidence and limitations: [PR write-up](../docs/plans/TICKET-143-pr.md).

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-12 — todo → claimed — divine (codex)
- 2026-11-12 — todo → in_progress — divine (codex)
