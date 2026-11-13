---
id: TICKET-233
title: Recover merged tickets whose original PR was not recorded
epic: quality
status: in_progress
priority: high
estimate: S
labels: [infra, test]
module: shared
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-233
pr: ""
created: 2026-11-13
updated: 2026-11-13
started: 2026-11-13
completed: ""
reason: ""
resume_to: ""
---

# TICKET-233: Recover merged tickets whose original PR was not recorded

## Context

See [verified repair reconciliation](../docs/tickets.md#recover-an-already-merged-ticket-after-a-verified-repair).

TICKET-076 was merged as PR140 while its ledger stayed in_progress with no PR URL. Its approved manual-QA transfer is now on develop via TICKET-232, but normal completion correctly rejects skipping review and existing repair reconciliation requires an already-recorded PR. Add an explicit, verified historical recovery path rather than editing statuses by hand.

## Scope

- Allow repair reconciliation to supply an original repository PR number only when the original PR field is empty.
- Validate original merged PR ticket identity, exact branch, same repository and unchanged metadata; retain all existing owner, lifecycle, dependency, ancestry, current/tested criteria and exact-head full-CI requirements.
- Atomically record the verified original PR URL with completion, only after all evidence succeeds.
- Document and regression-test rejection cases; use the merged repair to reconcile076 and the already-merged ordering chain without modifying collaborator worktrees.

## Out of scope

- Replacing existing original PR links, accepting failed or partial CI, bypassing acceptance criteria, direct status edits, or claiming physical device QA passed.

## Acceptance criteria

- [x] An owned in-progress or blocked ticket with a missing original PR can recover only with explicitly supplied verified merged PR identity and separate full repair proof.
- [x] Wrong ticket/branch/repository, changing metadata, an existing recorded PR, failed CI or unfinished dependencies leave the ledger unchanged.
- [x] CLI docs describe the option and focused regression tests pass without weakening existing cases.

## Test plan

- Unit and real-Git CLI fixtures for successful missing-link recovery and fail-closed cases.
- Existing ticket reconciliation suite and verify:quick; required full hosted CI before merge.

## Files likely touched

- scripts/tickets.ts, scripts/tickets/reconcile.ts, scripts/__tests__/tickets.test.ts, docs/tickets.md.

## Notes / decisions

- 2026-11-13: Added15 real-Git CLI cases; initial3 failures prove absent support/ignored override. Final141 focused ticket/reconciliation tests pass, lint and types pass, independent source review clean. No lifecycle guard bypass or original-link overwrite is allowed.

- 2026-11-13: Root assigned this narrow repair after the existing CLI correctly refused076 completion. Physical tablet QA stays unchecked in201.

## Activity log

- 2026-11-13 — new → todo — divine (codex)
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
