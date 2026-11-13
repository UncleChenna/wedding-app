---
id: TICKET-247
title: Reconcile reviewed UI baselines after merged design changes
epic: foundations
status: in_progress
priority: high
estimate: M
labels: [test]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-247
pr: ""
created: 2026-11-13
updated: 2026-11-13
started: 2026-11-13
completed: ""
reason: ""
resume_to: ""
---

# TICKET-247: Reconcile reviewed UI baselines after merged design changes

## Context

Merged theme, invitation hero and accessibility work changed intentional guest layouts after TICKET-135's Linux baselines were captured. PR #197's visual job reports 80 screenshot mismatches and 60 passes. Reconcile these with the approved design requirements in [PRD](../docs/prd.md), without hiding unintended regressions.

## Scope

- Inspect expected, actual and difference images from the real Linux CI run against the approved merged changes.
- Extend the exact admin navigation expectation to include the merged Invitation design route; retain every focus/keyboard assertion.
- Refresh only reviewed intentional guest snapshots using Linux artifacts; document the affected routes, themes, viewport sizes and reasons.
- Fix any newly identified unintended visual regression within this ticket's focused scope, with independent review.

## Out of scope

- Changing screenshot tolerances, deleting visual cases, disabling CI or certifying physical-device/release QA.
- Unrelated UI redesign and push-provider verification (TICKET-112).

## Acceptance criteria

- [x] Every changed baseline is traceable to a reviewed intentional change or a documented regression correction.
- [x] Updated images come from the actual Linux runner and an independent reviewer inspects representative expected/actual/difference images.
- [x] Existing visual assertions, route/theme/device coverage and strict tolerances remain unchanged.
- [x] Mobile and desktop admin keyboard tests cover all ten sections, including Invitation design, with visible focus.
- [ ] A fresh CI visual run passes against the updated committed baselines; other required checks pass before merge.

## Test plan

- Manual: inspect the failing Linux artifacts from run 43411506204, job 131839484742, and record old/new geometry and expected design differences.
- End-to-end: run the existing visual regression workflow on the final branch; do not substitute macOS screenshots for Linux baselines.
- Unit/static: review git diffs for unchanged assertion counts/tolerances and preserve any remaining failures as unresolved.

## Files likely touched

- `e2e/admin-shell.spec.ts`

- `e2e/regression/guest-pages.spec.ts-snapshots/*-linux.png`
- `docs/plans/TICKET-247-pr.md`
- `docs/reviews/TICKET-247/`

## Notes / decisions

- 2026-11-13: Scope explicitly expanded to both stale UI expectations after the same approved merges: Linux screenshots and the exact admin navigation list. No separate TICKET-249 was allocated. Initial general CI failed both keyboard cases solely because the new Invitation design link was absent from the expected list.

- 2026-11-13: Explicitly delegated after the user requested autonomous completion. The initial 80 failures are screenshot mismatches, not proof that all differences are intentional.

## Activity log

- 2026-11-13 — new → backlog — divine (codex)
- 2026-11-13 — backlog → todo — divine (codex)
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
