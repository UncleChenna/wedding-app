---
id: TICKET-022
title: Generate a full palette from one or two seed colours
epic: design-system
status: backlog
priority: low
estimate: M
labels: [design, frontend]
module: theming
owner: ""
agent: ""
blocked_by: [TICKET-010]
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

# TICKET-022: Generate a full palette from one or two seed colours

## Context

THM-7 (Could): let the couple start a theme from their wedding colours.

See: [How theming works](../docs/prd.md#how-theming-works) (THM-7).

## Scope

- Pure function: seed hex → full token set that passes AA.
- Used by the theme editor when present.

## Out of scope

- Editor UI (TICKET-098).

## Acceptance criteria

- [ ] For 20 random seeds, generated themes pass the contrast gate.
- [ ] Status tokens are never altered by the generator.

## Test plan

- Unit: Property-style tests over seeds.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/theming/lib/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → backlog — UncleChenna (claude) — created from the PRD and docs/current-state.md
