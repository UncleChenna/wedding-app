---
id: WED-010
title: Add fixed semantic status tokens for valid, used and invalid
epic: design-system
status: todo
priority: urgent
estimate: M
labels: [design, frontend]
module: theming
owner: ""
agent: ""
blocked_by: [WED-009]
blocks: [WED-013, WED-017, WED-019, WED-022]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-010: Add fixed semantic status tokens for valid, used and invalid

## Context

Staff screens need green/amber/red with the same meaning in every theme. There is no warning/amber token today.

See: [How theming works](../docs/prd.md#how-theming-works) (THM-4) · [Design principles (repo)](../docs/design-principles.md).

## Scope

- Add `success`, `warning`, `danger` (+ foreground and subtle variants) as shared semantic tokens with stable hues.
- Contrast gate covers every status pair in every theme.
- Document the tokens in docs/theming.md and show them on /dev/theme.

## Out of scope

- Staff result components (WED-019).

## Acceptance criteria

- [ ] Every theme defines the status tokens and passes AA for each status foreground/background pair.
- [ ] Hues stay within a documented range across themes (green, amber, red).
- [ ] /dev/theme shows the three statuses with text labels in both themes.

## Test plan

- Unit: Contrast and hue-range tests.
- End-to-end: Smoke `/dev/theme` asserts the status swatches render.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/theming/lib/schema.ts`
- `src/modules/theming/themes/*.json`
- `src/app/globals.css`
- `docs/theming.md`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
