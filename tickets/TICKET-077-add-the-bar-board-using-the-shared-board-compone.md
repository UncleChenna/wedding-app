---
id: TICKET-077
title: Add the bar board using the shared board component
epic: ordering
status: done
priority: high
estimate: S
labels: [frontend]
module: ordering
owner: unclechenna
agent: claude
blocked_by: [TICKET-076]
blocks: [TICKET-133]
branch: TICKET-077
pr: https://github.com/UncleChenna/wedding-app/pull/155
created: 2026-10-21
updated: 2026-11-10
started: 2026-11-10
completed: ""
reason: ""
resume_to: ""
---

# TICKET-077: Add the bar board using the shared board component

## Context

The bar gets its own board for drinks, with a bar PIN.

See: [Table ordering](../docs/prd.md#table-ordering) (ORD-4).

## Scope

- /bar route with station=bar.
- Bar PIN cannot open /kitchen.

## Out of scope

- Separate bar layout.

## Acceptance criteria

- [x] Drink orders appear only on /bar; food only on /kitchen (e2e).
- [x] PIN separation tested.

## Test plan

- End-to-end: Routing per station.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/(staff)/bar/`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-10 (unclechenna, claude):
  - **One shared board:** the TICKET-076 kitchen board became `StationBoard` and `StationScreen` with a `station`
    prop. Each station reads `GET /api/<station>/board` and listens on its own channel.
  - **Bar projection:** the bar query never reads guests, and its response schema has no dietary field, so dietary
    notes can't reach the bar even if a query returned them (unit-tested).
  - **Stacked on TICKET-076 (#140):** merge that first.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-10 — todo → claimed — unclechenna (claude) — started ahead of TICKET-076 (in_progress)
- 2026-11-10 — todo → in_progress — unclechenna (claude) — started ahead of TICKET-076 (in_progress)
- 2026-11-10 — in_progress → in_review — unclechenna (claude)
