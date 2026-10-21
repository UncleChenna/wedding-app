---
id: TICKET-014
title: Create the couple's theme from their colours and photos
epic: design-system
status: todo
priority: urgent
estimate: S
labels: [design, human]
module: theming
owner: ""
agent: ""
blocked_by: [TICKET-008, TICKET-013, TICKET-170]
blocks: [TICKET-176]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-014: Create the couple's theme from their colours and photos

## Context

The live site should wear the couple's own colours from TICKET-008.

See: [How theming works](../docs/prd.md#how-theming-works) · [Open questions](../docs/prd.md#open-questions).

## Scope

- New theme JSON from the chosen colours; contrast-checked.
- Make it the default active theme.

## Out of scope

- Palette generator (TICKET-022).

## Acceptance criteria

- [ ] The couple's theme passes the contrast gate.
- [ ] Screenshots of `/` and `/dev/theme` at three widths are approved by the couple in notes.

- [ ] Use ivory #FFF9EF, champagne #D6BE8D and chocolate #432B22, with chocolate text/controls and champagne as decoration or accessible fill. Include the spike QR/accent token additions.

## Test plan

- Manual: Couple approves screenshots.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: approved palette screenshots plus measured AA text contrast, not a new palette decision.

## Files likely touched

- `src/modules/theming/themes/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
