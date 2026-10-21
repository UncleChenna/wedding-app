---
id: WED-013
title: Ship third and fourth preset themes
epic: design-system
status: todo
priority: medium
estimate: M
labels: [design, frontend]
module: theming
owner: ""
agent: ""
blocked_by: [WED-010, WED-011]
blocks: [WED-014, WED-135]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-013: Ship third and fourth preset themes

## Context

THM-5 asks for 3–4 presets to start from; we have two.

See: [How theming works](../docs/prd.md#how-theming-works) (THM-5).

## Scope

- Two new presets with distinct moods (e.g. sage garden, blush editorial).
- Each passes the contrast gate and the UI checklist.

## Out of scope

- The couple's custom theme (WED-014).

## Acceptance criteria

- [ ] Four themes are registered and listed on /dev/theme.
- [ ] Screenshots of /dev/theme at 375/768/1280 in all four themes are attached.
- [ ] `pnpm verify` passes.

## Test plan

- End-to-end: Visual screenshots for every theme.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/theming/themes/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
