# TICKET-223: cover scan reconciliation safety boundaries

## Summary

The scan-sync helper's defensive fallback must admit nobody when an internal caller
bypasses input validation. This PR extends the existing fractional-count regression
with zero, negative, NaN and infinite counts, schema rejection, immutability and all
four device refusal outcomes. Production code and coverage thresholds are unchanged.

The narrow coverage repair from PR141 is already on develop and is retained
verbatim. This PR supplies the broader safety regressions described below.

## Changes

- Zero, negative, fractional, NaN and infinite reported counts must fail input
  validation and defensively reconcile as invalid with zero admitted and a conflict.
- Neither the physical report nor canonical state may be mutated by reconciliation.
- All four device refusal outcomes remain refusals, even if the current server
  invitation is eligible. Refusals never retroactively admit someone.

## Verification

- Reproduced original scoped failure:92.3%lines/83.33%branches; uncovered line82.
- Added tests pass19/19; scan-sync.ts now100%lines/branches/functions.
- Integrated develop `3e75175e`: full unchanged `caffeinate -is pnpm test` passes 1,484 tests, with 178 opt-in skips (184 test files passed, 36 skipped) in 147.96 seconds. Aggregate critical coverage98.66%lines/99.31%branches; every file passes95%, including scan-sync100%.
- verify:quick: lint/types/19related tests pass.
- Independent test-only review clean: invalid-count defense and refusal preservation verified; no production/config changes. Final hosted CI remains required before merge.

## Risks and rollout

No runtime, database, dependency, UI, CI configuration or migration changes.
No existing test or assertion was removed. Pure tests require no database;
opt-in database suites are not claimed by this change. Existing release/device
gates remain mandatory. TICKET-060 stays blocked with draftPR139 preserved.

## Rollback

Reverting removes the additional regressions only. The existing narrow coverage
repair remains on develop; application behavior and data are unchanged.

Ticket: tickets/TICKET-223-cover-scan-reconciliation-safety-boundaries.md

## Screenshots and UI checklist

N/A: tests only; no rendered interface, styling or browser behavior changed.

## Acceptance criteria and evidence

All missing defensive reconciliation cases have behavioral assertions. Fullcoverage
and quick gates pass with unchanged thresholds; independent review is clean.
Evidence logs are in docs/reviews/TICKET-223/. Final required CI is checked beforemerge.

Integration review is clean: the sole conflict was resolved by retaining both sets
of assertions. Earlier exact-head CI passed all six jobs; fresh final-head CI is
required after this base update. Integrated logs are in docs/reviews/TICKET-223/.
