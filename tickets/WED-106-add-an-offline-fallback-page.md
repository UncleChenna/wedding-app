---
id: WED-106
title: Add an offline fallback page
epic: pwa
status: todo
priority: high
estimate: S
labels: [pwa, frontend]
module: shared
owner: ""
agent: ""
blocked_by: [WED-105]
blocks: [WED-113]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-106: Add an offline fallback page

## Context

Uncached navigations offline should land on a warm, useful page.

See: [Connectivity plan](../docs/prd.md#connectivity-plan-signal-unknown).

## Scope

- Themed offline page linking to the cached pass if present.

## Out of scope

- Offline ordering.

## Acceptance criteria

- [ ] Offline navigation to an uncached route shows the offline page (e2e).

## Test plan

- End-to-end: Offline navigation.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/offline/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
