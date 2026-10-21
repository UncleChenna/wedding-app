---
id: TICKET-013
title: Ship third and fourth preset themes
epic: design-system
status: todo
priority: urgent
estimate: M
labels: [design, frontend]
module: theming
owner: ""
agent: ""
blocked_by: [TICKET-010, TICKET-011, TICKET-170]
blocks: [TICKET-014, TICKET-021, TICKET-135]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-013: Ship third and fourth preset themes

## Context

THM-5 asks for 3–4 presets to start from; we have two.

See: [How theming works](../docs/prd.md#how-theming-works) (THM-5).

## Scope

- Two new presets with distinct moods (e.g. sage garden, blush editorial).
- Each passes the contrast gate and the UI checklist.

## Out of scope

- The couple's custom theme (TICKET-014).

## Acceptance criteria

- [ ] Four themes are registered and listed on /dev/theme.
- [ ] Screenshots of /dev/theme at 375/768/1280 in all four themes are attached.
- [ ] `pnpm verify` passes.

- [ ] Use the spike pairings: Cormorant Garamond + Inter for Ivory & Gold, Playfair Display + Inter for Emerald Night, and Cormorant Garamond + Jost for Blush & Sage. Preserve fixed semantic success/warning/error hues.

## Test plan

- End-to-end: Visual screenshots for every theme.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: compare all three complete presets at 375/768/1280, including long guest names and all scanner results.

## Files likely touched

- `src/modules/theming/themes/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
