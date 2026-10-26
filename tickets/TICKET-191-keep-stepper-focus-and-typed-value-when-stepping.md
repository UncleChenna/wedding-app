---
id: TICKET-191
title: Keep stepper focus and typed value when stepping
epic: design-system
status: in_review
priority: medium
estimate: S
labels: [frontend]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-018]
blocks: []
branch: TICKET-191
pr: https://github.com/UncleChenna/wedding-app/pull/29
created: 2026-10-25
updated: 2026-10-26
started: 2026-10-26
completed: ""
reason: ""
resume_to: ""
---

# TICKET-191: Keep stepper focus and typed value when stepping

## Context

Review of PR #19 (TICKET-018) found two keyboard issues in the shared QuantityStepper used by the order page and RSVP: the − / + button loses focus when it becomes disabled at a bound, and pressing an arrow key while a typed value is uncommitted steps from the old value. See: [Table ordering](../docs/prd.md#table-ordering) (ORD-3) · [Design principles (repo)](../docs/design-principles.md).

## Scope

- Keep keyboard focus usable when a step button reaches its bound (aria-disabled or move focus to the input).
- Commit a typed draft before stepping with arrow keys.
- Pass through `className` and `required` like the other controls.

## Out of scope

- Visual redesign of the stepper.

## Acceptance criteria

- [x] After pressing + until the maximum with the keyboard, focus is still on a focusable element inside the stepper (browser test).
- [x] Typing 3 and pressing ArrowUp yields 4, not the previous value plus one (unit test).
- [x] `className` and `required` reach the input (unit test).

## Test plan

- Unit: QuantityStepper keyboard and prop tests.
- End-to-end: focus check at 375px on /dev/theme.
- Gate: `pnpm verify` passes.

## Files likely touched

- `src/modules/shared/components/ui/quantity-stepper.tsx`
- `src/modules/shared/__tests__/form-controls.test.tsx`

## Notes / decisions

- 2026-10-26: Fixed draft stepping, focus at bounds and input props. Quick/full gates pass: 235 unit tests, 95 browser passes, 13 conditional skips. Theme/width evidence in docs/reviews/TICKET-191/.

- 2026-10-25: Raised by the PR #19 review (non-blocking nits); filed so the work is tracked.

## Activity log

- 2026-10-25 — new → todo — unclechenna (claude)
- 2026-10-26 — todo → claimed — divine (codex)
- 2026-10-26 — todo → in_progress — divine (codex)
- 2026-10-26 — in_progress → in_review — divine (codex)
