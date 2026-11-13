---
id: TICKET-242
title: Run offline-pass fixtures before retained ordering settings
epic: quality
status: in_progress
priority: urgent
estimate: S
labels: [test, infra]
module: shared
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-242
pr: ""
created: 2026-11-13
updated: 2026-11-13
started: 2026-11-13
completed: ""
reason: ""
resume_to: ""
---

# TICKET-242: Run offline-pass fixtures before retained ordering settings

## Context

TICKET-113's saved-pass CI check runs after ordering fixtures retain a default settings row. Run 43402002867 failed its strict non-test-settings refusal despite the prior guest/scanner/order journeys passing. Preserve the guard and run the isolated fixture before ordering writes its retained row. See [quality requirements](../docs/prd.md#what-flawless-means-in-testing).

## Scope

- Move only the saved-pass CI step immediately after the guest journey.
- Add a regression for the required fixture ordering.
- Prove guest then offline-pass execution without relaxing assertions or data guards.

## Out of scope

- Product logic, scanner diagnostic repairs, changing other fixtures, deleting shared settings, or increasing test timeouts.

## Acceptance criteria

- [x] CI runs saved-pass verification after the guest journey and before ordering fixture setup.
- [x] The ordering regression fails on the old workflow and passes on the corrected workflow.
- [ ] Actual isolated guest and offline-pass browser checks pass, retaining all existing assertions and safety guards.

## Test plan

- Unit: CI-parity regression, red then green.
- Browser: mobile and desktop guest-to-offline-pass sequence on owned isolated database.
- Hosted: fresh required CI before completion; use verified repair evidence to reconcile TICKET-113 only after success.

## Files likely touched

- `.github/workflows/ci.yml`
- `scripts/__tests__/ci-parity.test.ts`

## Notes / decisions

- 2026-11-13 — TICKET-113 was externally merged at 0ac2159f while its invitation lane failed. This separate ticket preserves that failure and tracks the reviewed repair. No failed check is treated as passing.

- 2026-11-13 — CI-parity regression: old order1failed/2passed, corrected order3passed. Guest mobile/desktop both pass; mobile offline pass succeeds22.8s. Desktop unchanged30s overall budget expires under severe concurrent local compilation; preserved traces, no threshold changes. Hosted sequence proof still required.

## Activity log

- 2026-11-13 — new → backlog — divine (codex)
- 2026-11-13 — backlog → todo — divine (codex)
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
