---
id: TICKET-192
title: Tidy StatusPanel detail rendering and test selectors
epic: design-system
status: in_review
priority: low
estimate: S
labels: [frontend, test]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-019]
blocks: []
branch: TICKET-192
pr: https://github.com/UncleChenna/wedding-app/pull/33
created: 2026-10-25
updated: 2026-10-26
started: 2026-10-26
completed: ""
reason: ""
resume_to: ""
---

# TICKET-192: Tidy StatusPanel detail rendering and test selectors

## Context

Non-blocking review notes on PR #20 (TICKET-019) for the shared staff status components. See: [Design principles (repo)](../docs/design-principles.md) · [Journey 2: check-in at the gate](../docs/prd.md#journey-2-check-in-at-the-gate).

## Scope

- `StatusPanel`: render `detail` only when it is a non-empty node (a numeric 0 must not render as stray text).
- Browser size test: locate label, identifier and detail by test id or role instead of `<p>` order.
- `StatusBadge`: optional icon override for board statuses whose meaning differs from the tone default.

## Out of scope

- New statuses or colours.

## Acceptance criteria

- [x] Passing `detail={0}` renders no stray "0" (unit test).
- [x] The e2e size check selects elements by test id or role, not position (code review).
- [x] `StatusBadge` accepts an icon override and defaults to the tone icon (unit test).

## Test plan

- Unit: status-panel tests for detail and icon override.
- End-to-end: existing staff-status size test still passes with the new selectors.
- Gate: `pnpm verify` passes.

## Files likely touched

- `src/modules/shared/components/ui/status-panel.tsx`
- `src/modules/shared/__tests__/status-panel.test.tsx`
- `e2e/a11y.spec.ts`

## Notes / decisions

- 2026-10-26: Fixed detail and icon handling with regression coverage, stable sizing selectors and showcase evidence. Clean quick/full gate: 251 unit, 155 browser passes, 17 conditional skips; screenshots six passed. Shared-component PR remains for human review.

- 2026-10-25: Filed from the PR #20 review (non-blocking nits) so the follow-up is tracked.

## Activity log

- 2026-10-25 — new → todo — unclechenna (claude)
- 2026-10-26 — todo → claimed — divine (codex)
- 2026-10-26 — todo → in_progress — divine (codex)
- 2026-10-26 — in_progress → in_review — divine (codex)
