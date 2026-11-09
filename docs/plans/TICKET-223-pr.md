# TICKET-223: cover scan reconciliation safety boundaries

## Problem and result

The merged scan-sync helper caused the unchanged per-file95% coverage gate to fail:
92.3%lines and83.33%branches. The missing path was its defensive invalid-count
fallback, used if an internal caller bypasses schema validation. This PR adds
behavioral regressions without changing production code, thresholds or exclusions.

## Changes

- Zero, negative, fractional, NaN and infinite reported counts must fail input
  validation and defensively reconcile as invalid with zero admitted and a conflict.
- Neither the physical report nor canonical state may be mutated by reconciliation.
- All four device refusal outcomes remain refusals, even if the current server
  invitation is eligible. Refusals never retroactively admit someone.

## Acceptance and evidence

- Reproduced original scoped failure:92.3%lines/83.33%branches; uncovered line82.
- Added tests pass19/19; scan-sync.ts now100%lines/branches/functions.
- Full unchanged pnpm test and verify:quick are running/pending.
- Independent review requested. Final hosted CI remains required before merge.

## Scope and limitations

No runtime, database, dependency, UI, CI configuration or migration changes.
No existing test or assertion was removed. Pure tests require no database;
opt-in database suites are not claimed by this change. Existing release/device
gates remain mandatory. TICKET-060 stays blocked with draftPR139 preserved.

## Rollback

Revert this test-only commit; doing so restores the failing coverage gate and does
not alter application behavior or data.

Ticket: tickets/TICKET-223-cover-scan-reconciliation-safety-boundaries.md
