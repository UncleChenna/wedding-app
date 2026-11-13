---
id: TICKET-119
title: Optimise every image for AVIF/WebP, sizes and blur
epic: quality
status: done
priority: urgent
estimate: M
labels: [frontend]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-038]
blocks: [TICKET-154, TICKET-176]
branch: TICKET-119
pr: https://github.com/UncleChenna/wedding-app/pull/193
created: 2026-10-21
updated: 2026-11-13
started: 2026-11-13
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

- [x] A test fails if any next/image lacks sizes or dimensions on guest routes.
- [x] Largest image on /i/<token> ≤150 KB at 375px.

## Test plan

- Unit: Image usage scan.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/`

## Notes / decisions

- 2026-11-13 — Started ahead of TICKET-038 under the supported workflow. Eight source-policy tests pass; explicit AVIF/WebP configuration added. Private invitation byte-budget verification awaits the merged hero. Keep PR draft; no completed dependency or mobile budget is inferred. See docs/plans/TICKET-119-pr.md.

- 2026-11-13 — Integrated develop 21722cb9 including merged hero. Production build and eight source-policy tests pass; actual private 375px invitation delivers 28,120-byte AVIF at DPR 2.625. Evidence in docs/reviews/TICKET-119/mobile-image-budget.json. Hosted CI still required; unrelated merged PWA fixture-order repair is tracked in TICKET-242.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-13 — todo → claimed — divine (codex) — started ahead of TICKET-038 (in_progress)
- 2026-11-13 — todo → in_progress — divine (codex) — started ahead of TICKET-038 (in_progress)
- 2026-11-13 — in_progress → in_review — divine (codex)
