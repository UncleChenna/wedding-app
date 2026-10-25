---
id: TICKET-020
title: Add theme-driven dividers, monogram and paper texture
epic: design-system
status: in_review
priority: urgent
estimate: S
labels: [design, frontend]
module: shared
owner: unclechenna
agent: claude
blocked_by: [TICKET-011]
blocks: [TICKET-021]
branch: TICKET-020
pr: https://github.com/UncleChenna/wedding-app/pull/25
created: 2026-10-21
updated: 2026-10-25
started: 2026-10-25
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

- [x] Components use only theme tokens (lint passes, no literals).
- [x] Demonstrated on /dev/theme in all themes.

## Test plan

- Unit: Render tests.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/components/ui/`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-10-25 (unclechenna): `Divider`, `Monogram` and `Paper` in `src/modules/shared/components/ui/decorations.tsx`, shown in a Decoration section on /dev/theme. The monogram takes initials as a prop until event settings exist (TICKET-025) and uses the display font (the script role arrives with TICKET-015). Found and fixed: a plain theme nested in a patterned one inherited its texture; `themeToCssVars` now resets `--t-pattern-*` when a theme has no pattern. Unit tests 218 passed; `pnpm verify` passed; decoration e2e passes in both themes at mobile and desktop.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-25 — todo → claimed — unclechenna (claude)
- 2026-10-25 — todo → in_progress — unclechenna (claude)
- 2026-10-25 — in_progress → in_review — unclechenna (claude)
