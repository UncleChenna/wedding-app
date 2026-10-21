---
id: TICKET-119
title: Optimise every image for AVIF/WebP, sizes and blur
epic: quality
status: todo
priority: urgent
estimate: M
labels: [frontend]
module: shared
owner: ""
agent: ""
blocked_by: [TICKET-038]
blocks: [TICKET-154, TICKET-176]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-119: Optimise every image for AVIF/WebP, sizes and blur

## Context

Images dominate guest page weight on weak signal.

See: [Design principles](../docs/prd.md#design-principles).

## Scope

- Audit all images; enforce `sizes`, formats, blur, dimensions; lint/test helper.

## Out of scope

- CDN changes.

## Acceptance criteria

- [ ] A test fails if any next/image lacks sizes or dimensions on guest routes.
- [ ] Largest image on /i/<token> ≤150 KB at 375px.

## Test plan

- Unit: Image usage scan.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
