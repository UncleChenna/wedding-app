---
id: WED-080
title: Open and close ordering on admin command
epic: ordering
status: todo
priority: high
estimate: S
labels: [backend, frontend]
module: ordering
owner: ""
agent: ""
blocked_by: [WED-025, WED-072]
blocks: []
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-080: Open and close ordering on admin command

## Context

Ordering opens only after the couple's entrance and closes at the end.

See: [Table ordering](../docs/prd.md#table-ordering) (ORD-7).

## Scope

- ordering_open setting enforced server-side.
- Closed page with a warm message; staff-entered orders still allowed.

## Out of scope

- Scheduling.

## Acceptance criteria

- [ ] With ordering closed, guest submits are rejected server-side (unit) and the page says so (e2e).
- [ ] Toggling takes effect within 5s.

## Test plan

- Unit: Gate check.
- End-to-end: Closed state.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/ordering/`
- `src/modules/admin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
