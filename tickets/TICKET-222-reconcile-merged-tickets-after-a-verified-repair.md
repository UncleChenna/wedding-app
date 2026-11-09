---
id: TICKET-222
title: Reconcile merged tickets after a verified repair
epic: foundations
status: in_progress
priority: high
estimate: S
labels: [test]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-222
pr: https://github.com/UncleChenna/wedding-app/pull/137
created: 2026-11-09
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-222: Reconcile merged tickets after a verified repair

## Context

TICKET-057 and TICKET-054 were merged while their verification was failing, then blocked honestly. TICKET-221 repaired and verified the combined develop baseline. The CLI cannot close these tickets without fabricating an open review state. Preserve the [ticket workflow](../docs/tickets.md) and [Security](../docs/prd.md#security) verification contract with a narrow recovery operation.

## Scope

- Add an explicit reconciliation command for owned blocked or in-progress tickets whose PR already merged.
- Require fresh develop ancestry for original and repair PRs, completed original acceptance criteria, and successful required CI on the repair's exact merged head.
- Record original PR, repair PR/head and verification evidence in the shared ledger activity.
- Keep ordinary transition and owner/dependency guards unchanged; reconcile eligible TICKET-057 and TICKET-054 only through the CLI after review.

## Out of scope

- Generic force flags, fabricated open PRs, bypassing pending or failed CI, manual status edits, or waiving physical release gates.

## Acceptance criteria

- [x] Explicit reconciliation completes an eligible owned merged ticket only after fresh original/repair ancestry, original criteria, dependency and exact-head successful CI checks.
- [x] Open/unmerged/wrong-base/unreachable repair, failed/pending/missing checks, changed head, incomplete criteria, other ownership and fetch failure refuse without ledger mutation.
- [x] Existing normal transitions remain unchanged; evidence is recorded with both PRs and repair head.
- [x] Focused regressions and quick verification pass; eligible historical tickets are reconciled only after the fix is reviewed and merged.

## Test plan

- Unit: real Git ancestry and stubbed GitHub metadata/check results, success plus fail-closed matrix.
- Integration: CLI ledger immutability on refusal and evidence on successful recovery.
- Manual: inspect original PR127/132 and repair PR131 ancestry and checks; physical gates TICKET-114/163 remain mandatory.

## Files likely touched

- scripts/tickets.ts, scripts/tickets workflow/evidence helpers and tests; docs/tickets.md.

## Notes / decisions

- 2026-11-09: Follow-up to verified TICKET-221; no target ticket status is manually changed.

## Activity log

- 2026-11-09 — new → backlog — divine
- 2026-11-09 — backlog → todo — divine
- 2026-11-09 — todo → claimed — divine (codex)
- 2026-11-09 — todo → in_progress — divine (codex)
- 2026-11-09 — Initial 74 focused tests and quick lint/types/76 related tests passed. Final CLI race matrix passed 20 cases; two shared-ledger mode refusals also pass after correcting their test environment. TICKET-057/054 status reconciliation is intentionally post-merge; no direct/manual status mutation occurred. PR: https://github.com/UncleChenna/wedding-app/pull/137.
- 2026-11-09 — in_progress → in_review — divine (codex)
- 2026-11-09 — in_review → in_progress — divine (codex) — Investigate unrelated guest-import asynchronous focus assertion failure in final CI before verified recovery merge
