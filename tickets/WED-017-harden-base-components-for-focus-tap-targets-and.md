---
id: WED-017
title: Harden base components for focus, tap targets and dialogs
epic: design-system
status: todo
priority: high
estimate: L
labels: [frontend, design]
module: shared
owner: ""
agent: ""
blocked_by: [WED-010]
blocks: [WED-018, WED-019, WED-037, WED-088, WED-115]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-017: Harden base components for focus, tap targets and dialogs

## Context

Button, Card, Input, Sheet and Toast exist but are unverified against the 44px, focus, dialog and bottom-sheet rules every feature will reuse.

See: [Design principles](../docs/prd.md#design-principles) · [Usability and accessibility](../docs/prd.md#usability-and-accessibility) · [Design principles (repo)](../docs/design-principles.md).

## Scope

- 44×44 targets, visible 3:1 focus rings, disabled/loading states.
- Sheet as a bottom sheet on mobile with focus trap, Escape and focus return.
- Toast with `aria-live` and no colour-only meaning.

## Out of scope

- New form controls (WED-018).

## Acceptance criteria

- [ ] Each component has tests for keyboard operation and labels.
- [ ] Sheet traps focus, closes on Escape and restores focus to its trigger (e2e).
- [ ] axe reports no violations on /dev/theme in both themes.

## Test plan

- Unit: Testing Library keyboard tests.
- End-to-end: Sheet focus test at 375px.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/components/ui/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
