---
id: TICKET-020
title: Add theme-driven dividers, monogram and paper texture
epic: design-system
status: todo
priority: urgent
estimate: S
labels: [design, frontend]
module: shared
owner: ""
agent: ""
blocked_by: [TICKET-011]
blocks: [TICKET-021]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-020: Add theme-driven dividers, monogram and paper texture

## Context

The printed-invitation feel comes from hairline dividers, a monogram and texture, which must come from the theme, not one-off styles.

See: [Design principles](../docs/prd.md#design-principles) · [Design principles (repo)](../docs/design-principles.md).

## Scope

- Divider, Monogram (initials from settings) and texture background components.
- No hard-coded colours; reduced visual weight on staff screens.

## Out of scope

- IV layout (TICKET-037).

## Acceptance criteria

- [ ] Components use only theme tokens (lint passes, no literals).
- [ ] Demonstrated on /dev/theme in all themes.


## Test plan

- Unit: Render tests.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).


## Files likely touched

- `src/modules/shared/components/ui/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
