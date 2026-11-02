---
id: TICKET-022
title: Generate a full palette from one or two seed colours
epic: design-system
status: in_progress
priority: low
estimate: M
labels: [design, frontend]
module: theming
owner: divine
agent: codex
blocked_by: [TICKET-010]
blocks: []
branch: TICKET-022
pr: ""
created: 2026-10-21
updated: 2026-11-02
started: 2026-11-02
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

- [x] For 20 random seeds, generated themes pass the contrast gate.
- [x] Status tokens are never altered by the generator.

## Test plan

- Unit: Property-style tests over seeds.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/theming/lib/`

## Notes / decisions

2026-11-02: Pure generator implemented;66 new tests and145 theme tests pass. Quick gate passes. Full verification is running; no editor activation or device certification claimed. See docs/handoffs/TICKET-022.md.

## Activity log

- 2026-10-21 — new → backlog — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-02 — backlog → todo — divine
- 2026-11-02 — todo → claimed — divine (codex)
- 2026-11-02 — todo → in_progress — divine (codex)
