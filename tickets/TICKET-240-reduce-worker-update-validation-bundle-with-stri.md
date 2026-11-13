---
id: TICKET-240
title: Reduce worker update validation bundle with strict guards
epic: quality
status: done
priority: high
estimate: S
labels: [frontend, test]
module: shared
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-240
pr: https://github.com/UncleChenna/wedding-app/pull/198
created: 2026-11-13
updated: 2026-11-13
started: 2026-11-13
completed: ""
reason: ""
resume_to: ""
---

# TICKET-240: Reduce worker update validation bundle with strict guards

## Context

The shared worker-update client loads full Zod on guest pages for a small strict reply protocol. TICKET-116 measures mobile performance against the [PRD](../docs/prd.md); the hero preview currently scores 90. Reduce unnecessary parser code without changing safety behavior.

## Scope

- Use the installed tree-shakable Zod Mini implementation for worker update replies.
- Preserve strict discriminated states, integer bounds and fail-closed handling.
- Record reproducible before/after minified and compressed browser bundle sizes.

## Out of scope

- Changing update, reload or queue-lock behavior; raising performance thresholds.
- Final image-page Lighthouse baseline, tracked in TICKET-116.

## Acceptance criteria

- [x] Valid reply states retain identical parsed results and malformed/extra-field replies fail closed.
- [x] Browser module bundle shrinks with exact before/after byte evidence and no new dependency.
- [x] Existing worker update safety tests and quick verification pass.

## Test plan

- Unit: worker reply boundary cases and existing update/locking tests.
- End-to-end: existing CI worker update coverage; final page measurement in TICKET-116.
- Manual: inspect measured bundle and independent review; no visual behavior changes.

## Files likely touched

- `src/modules/shared/browser/worker-update-client.ts`
- `src/modules/shared/__tests__/worker-update-client.test.ts`

## Notes / decisions

- 2026-11-13: Scoped performance follow-up; retain the 95 Lighthouse target.

## Activity log

- 2026-11-13 — new → todo — divine
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
- 2026-11-13 — in_progress → in_review — divine (codex)
