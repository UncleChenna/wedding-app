---
id: WED-014
title: Create the couple's theme from their colours and photos
epic: design-system
status: todo
priority: medium
estimate: S
labels: [design]
module: theming
owner: ""
agent: ""
blocked_by: [WED-008, WED-013]
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

# WED-014: Create the couple's theme from their colours and photos

## Context

The live site should wear the couple's own colours from WED-008.

See: [How theming works](../docs/prd.md#how-theming-works) · [Open questions](../docs/prd.md#open-questions).

## Scope

- New theme JSON from the chosen colours; contrast-checked.
- Make it the default active theme.

## Out of scope

- Palette generator (WED-022).

## Acceptance criteria

- [ ] The couple's theme passes the contrast gate.
- [ ] Screenshots of `/` and `/dev/theme` at three widths are approved by the couple in notes.

## Test plan

- Manual: Couple approves screenshots.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/theming/themes/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
