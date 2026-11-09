---
id: TICKET-219
title: Require successful verification before direct review transitions
epic: foundations
status: in_progress
priority: urgent
estimate: S
labels: [infra, test]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-219
pr: ""
created: 2026-11-08
updated: 2026-11-09
started: 2026-11-08
completed: ""
reason: ""
resume_to: ""
---

# TICKET-219: Require successful verification before direct review transitions

## Context

Independent review found that direct `t:move in_review` skips `pnpm verify`: the
preflight reports verification as true and the final ledger callback overrides
real evidence. Follow [the ticket workflow](../docs/tickets.md) and the
[PRD testing requirements](../docs/prd.md#milestones-scope-and-testing).
TICKET-215 merged in PR #97 while this defect was being investigated; this ticket
tracks only the follow-up repair.

## Scope

- Separate preflight checks from actual successful verification.
- Bind verification to the current HEAD and invocation, including the PR path.
- Add real-Git CLI regression coverage preserving ownership and other review gates.

## Out of scope

- TICKET-215's merged approval policy and reusable verification implementation.
- Product code, schema changes, UI, production deployment or weaker checks.

## Acceptance criteria

- [x] Direct review runs the selected verifier (`verify:quick` by default, `verify` with `--full`); failure leaves the shared ledger and ticket file unchanged.
- [x] A successful direct review advances the ledger only for the verified current HEAD.
- [x] An inherited verification marker and a HEAD change during verification cannot bypass the gate.
- [x] `t:pr` verifies once, reuses only its successful current invocation, and rejects HEAD changes.
- [x] Targeted regression suites and local quick verification pass; full CI and independent review are recorded before merge.

## Test plan

- Unit/integration: real-Git CLI tests use isolated fake verifier/GitHub executables for failure,
  success, forged markers, and HEAD changes; inspect ledger/file preservation.
- Run ticket, evidence and protected-artifact suites, then quick/full verification.
- Independently review the final PR and ensure all pre-existing gates remain.

## Files likely touched

- `scripts/tickets.ts`
- `scripts/__tests__/tickets.test.ts`
- Per-ticket plan, handoff and PR evidence.

## Notes / decisions

- 2026-11-09 — Integration head `704c77a9` passed all five required CI checks
  (run 42590329424), including full verification, migrations/seed and the
  mobile/desktop invitation journey. Independent integration review found no
  blocking issue. Final metadata-head CI remains required before merge.

- 2026-11-09 — Integrated develop `37e9202c` and preserved TICKET-217/218's approved
  quick-default review workflow and explicit full options. Expanded real-CLI coverage
  to 14 scenarios; all 61 targeted ticket/review/evidence tests pass. The prior
  head `2da7be90` passed all five required CI checks, including full verification.
  New-head quick verification, CI and independent review remain required.
- 2026-11-08 — Fresh branch quick gate passed; full gate passed through 1,105 unit
  tests (117 skipped) and production build. Browser run was stopped after local
  database unavailability caused four failures: 240 passed, five interrupted,
  777 not run (exit 130). Full gate remains incomplete. Independent read-only
  review found no blocking code issue; CI and a healthy isolated database are next.
- 2026-11-08 — Scoped follow-up to merged TICKET-215; initial four CLI cases
  failed because verification was never invoked. Preserved repair passed all
  50 targeted ticket/evidence/artifact tests before transfer to this branch.

## Activity log

- 2026-11-08 — new → todo — divine
- 2026-11-08 — todo → claimed — divine (codex)
- 2026-11-08 — todo → in_progress — divine (codex)
- 2026-11-08 — in_progress → blocked — divine (codex) — Full browser verification blocked by unavailable isolated database; 240 passed, 4 failed, 5 interrupted, 777 not run. Await CI and healthy isolated verification.
- 2026-11-09 — blocked → in_progress — divine (codex) — Integrate approved quick-default workflow while preserving fail-closed review checks
