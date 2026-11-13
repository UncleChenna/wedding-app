---
id: TICKET-242
title: Fix offline-pass CI fixture and navigation sequencing
epic: quality
status: done
priority: urgent
estimate: S
labels: [test, infra]
module: shared
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-242
pr: https://github.com/UncleChenna/wedding-app/pull/200
created: 2026-11-13
updated: 2026-11-13
started: 2026-11-13
completed: ""
reason: ""
resume_to: ""
---

# TICKET-242: Fix offline-pass CI fixture and navigation sequencing

## Context

TICKET-113's saved-pass CI check runs after ordering fixtures retain a default settings row. Run 43402002867 failed its strict non-test-settings refusal despite the prior guest/scanner/order journeys passing. Preserve the guard and run the isolated fixture before ordering writes its retained row. See [quality requirements](../docs/prd.md#what-flawless-means-in-testing).

## Scope

- Move only the saved-pass CI step immediately after the guest journey.
- Add a regression for the required fixture ordering.
- Synchronize the existing offline refresh navigation before asserting another invitation’s isolation; preserve all existing assertions and add explicit path checks.
- Prove guest then offline-pass execution without relaxing assertions or data guards.

## Out of scope

- Product logic, scanner diagnostic repairs, changing other fixtures, deleting shared settings, or increasing test timeouts.

## Acceptance criteria

- [x] CI runs saved-pass verification after the guest journey and before ordering fixture setup.
- [x] The ordering regression fails on the old workflow and passes on the corrected workflow.
- [x] Actual isolated guest and offline-pass browser checks pass, retaining all existing assertions and safety guards.

## Test plan

- Unit: CI-parity regression, red then green.
- Browser: mobile and desktop guest-to-offline-pass sequence on owned isolated database.
- Hosted: fresh required CI before completion; use verified repair evidence to reconcile TICKET-113 only after success.

## Files likely touched

- `.github/workflows/ci.yml`
- `scripts/__tests__/ci-parity.test.ts`
- `e2e/offline-pass.spec.ts`

## Notes / decisions

- 2026-11-13 — TICKET-113 was externally merged at 0ac2159f while its invitation lane failed. This separate ticket preserves that failure and tracks the reviewed repair. No failed check is treated as passing.

- 2026-11-13 — CI-parity regression: old order1 failed / 2 passed, corrected order3passed. Guest mobile/desktop both pass; mobile offline pass succeeds22.8s. Desktop unchanged 30s overall budget expires under severe concurrent local compilation; preserved traces, no threshold changes. Hosted sequence proof still required.

- 2026-11-13 — Hosted repair run 43406763393 revealed a distinct refresh-navigation race: unchanged timestamp matched before reload, which overwrote the next URL. Awaiting the actual main-frame navigation and asserting both paths preserves all original privacy checks; final local mobile 14.8s / desktop 13.7s both pass without timeout changes. Own database 39121 used; fresh final-head hosted CI remains required.

## Activity log

- 2026-11-13 — new → backlog — divine (codex)
- 2026-11-13 — backlog → todo — divine (codex)
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
- 2026-11-13 — in_progress → in_review — divine (codex)
