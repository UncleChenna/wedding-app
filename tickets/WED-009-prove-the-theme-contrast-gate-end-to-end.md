---
id: WED-009
title: Prove the theme contrast gate end to end
epic: design-system
status: todo
priority: high
estimate: S
labels: [test, design]
module: theming
owner: ""
agent: ""
blocked_by: []
blocks: [WED-010, WED-011, WED-015]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-009: Prove the theme contrast gate end to end

## Context

Migrated from SETUP-002. THM-3 requires a failing theme to be rejected with the failing pair named.

See: [How theming works](../docs/prd.md#how-theming-works) (THM-3).

## Scope

- Unit test: registering a theme that fails WCAG AA throws at load with the theme id and every failing pair.
- Follow `docs/theming.md` literally to add a temporary third theme in a test; fix any doc inaccuracy.

## Out of scope

- Adding real presets (WED-013).

## Acceptance criteria

- [ ] A unit test asserts the error names the theme id and every failing token pair.
- [ ] docs/theming.md steps work verbatim (any fix included).
- [ ] `pnpm verify` passes.

## Test plan

- Unit: src/modules/theming/__tests__/load-theme.test.ts.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/theming/lib/load-theme.ts`
- `src/modules/theming/__tests__/`
- `docs/theming.md`

## Notes / decisions

- 2026-10-21: Migrated from `docs/tasks.json` SETUP-002.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
