---
id: WED-121
title: Fail e2e on layout shift or console errors on guest pages
epic: quality
status: todo
priority: medium
estimate: M
labels: [test]
module: shared
owner: ""
agent: ""
blocked_by: [WED-116]
blocks: [WED-154]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-121: Fail e2e on layout shift or console errors on guest pages

## Context

"Flawless" means CLS 0 and no console errors.

See: [What "flawless" means in testing](../docs/prd.md#what-flawless-means-in-testing).

## Scope

- Playwright fixture recording console errors and CLS for guest routes.

## Out of scope

- Staff routes.

## Acceptance criteria

- [ ] Any console error or CLS > 0 on a guest route fails the suite (proved in notes).

## Test plan

- End-to-end: Fixture.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `e2e/fixtures.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
