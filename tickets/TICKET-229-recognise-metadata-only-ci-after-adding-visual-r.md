---
id: TICKET-229
title: Recognise metadata-only CI after adding visual regression
epic: foundations
status: in_progress
priority: high
estimate: S
labels: [infra, test]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-229
pr: ""
created: 2026-11-12
updated: 2026-11-12
started: 2026-11-12
completed: ""
reason: ""
resume_to: ""
---

# TICKET-229: Recognise metadata-only CI after adding visual regression

## Context

TICKET-135 adds a visual-regression CI job. TICKET-227's exact metadata-only job matcher knows only the original ten jobs, so a later PR-description edit would hide valid full repair evidence. Preserve the [PRD testing requirements](../docs/prd.md#what-flawless-means-in-testing) and strict proof semantics.

## Scope

- Recognise the exact historical ten-job and new eleven-job all-skipped metadata workflow shapes.
- Preserve event, head, completion, conclusion and known-name checks.
- Correct PR-167's neutral Linux-baseline wording rejected by the attribution matcher and rerun only failed checks.

## Out of scope

- Product code, visual baselines, changing CI suites or weakening attribution enforcement.

## Acceptance criteria

- [x] Historical ten-job and new eleven-job metadata runs are recognised, including GitHub's unevaluated-name form.
- [x] Unknown, duplicate, missing, failed, pending and wrong-head/event cases remain rejected.
- [x] Valid full evidence remains discoverable past either metadata-only shape; newer real failed/pending runs remain blocking.

## Test plan

- Unit: focused reconciliation regressions, including captured historical GitHub payload and new visual-job fixture.
- Gate: quick verification and selected hosted CI; independent review.

## Files likely touched

- scripts/tickets/reconcile.ts
- scripts/__tests__/ticket-reconcile.test.ts and fixtures

## Notes / decisions

- 2026-11-12: Owner authorized completing remaining tasks and PR maintenance. No database or UI changes.

- 2026-11-12: Captured actual eleven-job metadata run 43279926245. Regressions failed twice before the fix; all 15 pass afterward, including legacy ten-job payloads. Quick lint/types/related tests pass. Independent review found no blocker. PR-167 corrected body passes standalone PR-text run 43279926313; rerunning failed original jobs retained its old event body, so that aggregate still fails until a fresh code event. No heavy jobs were rerun.

## Activity log

- 2026-11-12 — new → backlog — divine (codex)
- 2026-11-12 — backlog → todo — divine (codex)
- 2026-11-12 — todo → claimed — divine (codex)
- 2026-11-12 — todo → in_progress — divine (codex)
