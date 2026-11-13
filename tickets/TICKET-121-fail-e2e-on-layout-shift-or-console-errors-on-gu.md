---
id: TICKET-121
title: Fail e2e on layout shift or console errors on guest pages
epic: quality
status: in_progress
priority: medium
estimate: M
labels: [test]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-116]
blocks: [TICKET-154]
branch: TICKET-121
pr: ""
created: 2026-10-21
updated: 2026-11-13
started: 2026-11-13
completed: ""
reason: ""
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

- [x] Any console error or CLS > 0 on a guest route fails the suite (proved in notes).

## Test plan

- End-to-end: Fixture.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `e2e/fixtures.ts`

## Notes / decisions

2026-11-13: Implemented automatic fixture for positive guest journeys. Three real injected faults are rejected after navigation/tab closure; four production mobile/desktop journeys pass7.8s. Independent review clean; /offline included, staff-only recovery excluded. Remains draft until TICKET-116 merges; see docs/reviews/TICKET-121/verification.md.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-13 — todo → claimed — divine (codex) — started ahead of TICKET-116 (in_progress)
- 2026-11-13 — todo → in_progress — divine (codex) — started ahead of TICKET-116 (in_progress)
