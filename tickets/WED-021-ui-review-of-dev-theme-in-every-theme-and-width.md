---
id: WED-021
title: UI review of /dev/theme in every theme and width
epic: design-system
status: todo
priority: medium
estimate: S
labels: [design, test]
module: theming
owner: ""
agent: ""
blocked_by: [WED-015, WED-016, WED-018, WED-019, WED-020]
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

# WED-021: UI review of /dev/theme in every theme and width

## Context

Migrated from SETUP-005: the component library needs a full UI checklist pass before features build on it.

See: [What "flawless" means in testing](../docs/prd.md#what-flawless-means-in-testing) · [Design principles (repo)](../docs/design-principles.md).

## Scope

- Run the ui-review skill on `/` and `/dev/theme` at 375/768/1280 in every theme.
- Fix blockers and should-fix findings.

## Out of scope

- Feature pages.

## Acceptance criteria

- [ ] Every UI checklist item has PASS/FAIL/N/A evidence in notes.
- [ ] No blocker remains; deferred should-fix items are listed with reasons.

## Test plan

- End-to-end: `SCREENSHOT_ROUTES=/,/dev/theme pnpm screenshots`.
- Manual: Inspect screenshots; keyboard and reduced-motion pass.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/components/ui/`
- `src/modules/theming/`

## Notes / decisions

- 2026-10-21: Migrated from `docs/tasks.json` SETUP-005.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
