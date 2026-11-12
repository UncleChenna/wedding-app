---
id: TICKET-133
title: Cover table ordering to the boards end to end
epic: testing
status: in_review
priority: high
estimate: M
labels: [test]
module: ordering
owner: unclechenna
agent: claude
blocked_by: [TICKET-075, TICKET-077, TICKET-078, TICKET-073, TICKET-080]
blocks: [TICKET-137, TICKET-154]
branch: TICKET-133
pr: https://github.com/UncleChenna/wedding-app/pull/166
created: 2026-10-21
updated: 2026-11-12
started: 2026-11-12
completed: ""
reason: ""
resume_to: ""
---

# TICKET-133: Cover table ordering to the boards end to end

## Context

Journey 3 must never break.

See: [Journey 3: ordering from the table](../docs/prd.md#journey-3-ordering-from-the-table).

## Scope

- Order → kitchen and bar boards → served → guest sees status; limits.

## Out of scope

- Load (TICKET-137).

## Acceptance criteria

- [x] The journey passes in CI with two browser contexts.

## Test plan

- End-to-end: Order spec.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `e2e/order.spec.ts`

## Notes / decisions

- 2026-11-12 (unclechenna, claude):
  - **Journey 3 spec:** `e2e/ordering-journey.spec.ts`, run by `scripts/test-ordering-journey.ts` (a throwaway
    staff secret) in CI's guest journey job. The guest, kitchen and bar each use their own browser context.
  - **CI has no Realtime** (plain Postgres, no JWT secret), so the boards catch up through their refetch fallback.
    Locally, with Realtime, the same spec passes faster.
  - **A real race it exposed:** "Start preparing" then a quick "Served" sent the second move before the first was
    saved, so the server refused it as out of date. A card's buttons now wait while its move saves.

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-12 — todo → claimed — unclechenna (claude) — started ahead of TICKET-075 (in_review), TICKET-077 (in_review), TICKET-078 (in_review)
- 2026-11-12 — todo → in_progress — unclechenna (claude) — started ahead of TICKET-075 (in_review), TICKET-077 (in_review), TICKET-078 (in_review)
- 2026-11-12 — in_progress → in_review — unclechenna (claude)
