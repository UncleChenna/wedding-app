---
id: TICKET-237
title: Bound browser transfer diagnostics without weakening wire budgets
epic: quality
status: done
priority: high
estimate: S
labels: [test]
module: ordering
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-237
pr: https://github.com/UncleChenna/wedding-app/pull/188
created: 2026-11-13
updated: 2026-11-13
started: 2026-11-13
completed: ""
reason: ""
resume_to: ""
---

# TICKET-237: Bound browser transfer diagnostics without weakening wire budgets

## Context

TICKET-129 CI run43386213746 stalls after the native-order wire and browser network quiescence checks pass. Trace shows the optional Playwright request-size collector never settles; teardown then masks the original stall. The unchanged PRD delivery budget is 200KB including worker installation.

## Scope

- Bound browser-only diagnostic collection and explicitly report unavailable sizes without dropping request records.
- Preserve the raw socket wire measurement, original budget and real worker/font requests.
- Ensure proxy resources close even when browser cleanup fails.

## Out of scope

- Product changes, larger budgets, timeout inflation or skipping assertions.

## Acceptance criteria

- [x] A never-resolving diagnostic is recorded as unavailable within a bounded interval, retaining request identity.
- [x] Successful diagnostics retain exact sizes; rejected diagnostics are explicit and do not produce unhandled rejections.
- [x] Raw wire budget remains200000bytes and all8 actual cold browser cases pass.
- [x] Cleanup always releases the owned proxy; report documents the actual failed trace.

## Test plan

- Focused unit tests for successful, rejected and never-resolving diagnostics.
- Existing native transfer matrix with real production server and owned synthetic database.
- Independent source review and quick lint/types.

## Files likely touched

- `e2e/order-performance.spec.ts`
- `e2e/support/`
- `scripts/__tests__/`

## Notes / decisions

2026-11-13: Follow-up preserves all raw traffic; browser-reported sizes are supplemental diagnostics only.

2026-11-13: Four diagnostic tests and all8actual cold-transfer cases pass, max182380bytes; build passes. Independent review clean. Exact wire evidence in docs/reviews/TICKET-237. Original129CI failure traced to diagnostic wait, not wire budget.

## Activity log

- 2026-11-13 — new → todo — divine
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
- 2026-11-13 — in_progress → in_review — divine (codex)
