---
id: TICKET-009
title: Prove the theme contrast gate end to end
epic: design-system
status: in_progress
priority: urgent
estimate: S
labels: [test, design]
module: theming
owner: divine
agent: codex
blocked_by: []
blocks: [TICKET-010, TICKET-011, TICKET-015, TICKET-170]
branch: TICKET-009
pr: https://github.com/UncleChenna/wedding-app/pull/9
created: 2026-10-21
updated: 2026-10-21
started: 2026-10-21
completed: ""
reason: ""
resume_to: ""
---

# TICKET-009: Prove the theme contrast gate end to end

## Context

Migrated from SETUP-002. THM-3 requires a failing theme to be rejected with the failing pair named.

See: [How theming works](../docs/prd.md#how-theming-works) (THM-3).

## Scope

- Unit test: registering a theme that fails WCAG AA throws at load with the theme id and every failing pair.
- Follow `docs/theming.md` literally to add a temporary third theme in a test; fix any doc inaccuracy.

## Out of scope

- Adding real presets (TICKET-013).

## Acceptance criteria

- [x] A unit test asserts the error names the theme id and every failing token pair.
- [x] docs/theming.md steps work verbatim (any fix included).
- [x] `pnpm verify` passes.

## Test plan

- Unit: src/modules/theming/__tests__/load-theme.test.ts.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/theming/lib/load-theme.ts`
- `src/modules/theming/__tests__/`
- `docs/theming.md`

## Notes / decisions

- 2026-10-21: Resolved develop conflicts, preserving merged prerequisite fixes and progress history. Quick and full verification passed: 108 unit tests, production build, 17 browser smoke passes and 7 existing skips.

- 2026-10-21: Loader and registry-import regressions assert all 11 failing fixture pairs and theme identity. Copied ivory-gold to a temporary sage-garden theme, edited its identity, registered it, and ran the documented theming tests successfully; setting foreground equal to background caused registry-load failure naming sage-garden. Removed the fixture afterwards. No production loader fix or palette change was needed. Quick gate and full verify passed (106 unit tests, 17 smoke passes, 7 existing skips).

- 2026-10-21: Migrated from `docs/tasks.json` SETUP-002.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-21 — todo → claimed — divine (codex)
- 2026-10-21 — todo → in_progress — divine (codex)
- 2026-10-21 — in_progress → in_review — divine (codex)
- 2026-10-21 — in_review → in_progress — divine (codex) — Resolve remaining PR conflicts with develop
