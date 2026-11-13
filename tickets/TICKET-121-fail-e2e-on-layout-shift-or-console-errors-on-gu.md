---
id: TICKET-121
title: Fail e2e on layout shift or console errors on guest pages
epic: quality
status: cancelled
priority: medium
estimate: M
labels: [test]
module: shared
owner: ""
agent: ""
blocked_by: [TICKET-116]
blocks: [TICKET-154]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-11-12
started: ""
completed: ""
reason: "Merged into TICKET-116 (TICKET-228)"
resume_to: ""
---

# TICKET-121: Fail e2e on layout shift or console errors on guest pages

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
- 2026-11-12 — todo → cancelled — unclechenna (claude) — merged into TICKET-116 (TICKET-228)
