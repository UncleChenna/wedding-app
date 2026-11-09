---
id: TICKET-224
title: Reconcile historical stacked ticket merges into develop
epic: foundations
status: in_review
priority: high
estimate: M
labels: [infra, test, docs]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-224
pr: https://github.com/UncleChenna/wedding-app/pull/148
created: 2026-11-09
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-224: Reconcile historical stacked ticket merges into develop

## Context

TICKET-186 PR #4 and TICKET-187 PR #5 merged in October into intermediate branches,
before the current develop-only workflow. Their changes appear in later develop content but original merge ancestry is absent;
their ledger states remain in_review. Existing completion/reconciliation requires
the original PR base to be develop. See [ticket workflow](../docs/tickets.md).

## Scope

- Add an explicit evidence-based CLI recovery for historical stacked merges.
- Prove original merge ancestry into a separately tested, merged develop integration
  and fresh origin/develop; verify completed criteria and exact-head successful CI.
- Preserve ownership, dependency, clean evidence and normal direct-merge checks.
- Verify the two historical tickets read-only; preserve refusal if ancestry is missing and track a separate provenance audit.

## Out of scope

- No Git history rewrite, PR retargeting, force status override or CI bypass.
- No deletion or edits to historical dirty worktrees. No product or database changes.

## Acceptance criteria

- [x] Real Git regressions accept an owned historical stacked merge only when its merge commit is an ancestor of the independently tested integration and fresh develop, with complete original criteria.
- [x] Unmerged/unrelated PRs, missing ancestry, incomplete criteria, wrong owners, unfinished dependencies and stale/pending/failed CI refuse without changing the ledger.
- [x] Original and integration PR/head/CI/develop evidence is preserved in the ledger activity; original PR identity remains unchanged.
- [x] Existing direct completion and repair reconciliation continue to pass their regressions.
- [x] Documentation explains the explicit recovery command and records actual TICKET-186/TICKET-187 refusal evidence; missing ancestry remains unresolved in a separate follow-up without status or worktree changes.

## Test plan

- Unit/integration: temporary Git histories and controlled GitHub evidence for valid stacks and all refusal cases, including a changed CI head/run during verification.
- CLI: assert refusal leaves ticket/ledger unchanged; successful recovery records exact evidence.
- Gate: verify:quick and full CI. Inspect actual #4/#5 merge ancestry and acceptance criteria before any status change.

## Files likely touched

- `scripts/tickets/reconcile.ts`, ticket CLI/helpers and focused tests.
- `docs/tickets.md`, this ticket and its PR/handoff evidence.

## Notes / decisions

- Scope correction after actual Git proof: neither historical merge is an ancestor of develop. This ticket delivers strict recovery tooling and honest refusal; TICKET-225 owns the unresolved provenance audit. TICKET-186/TICKET-187 remain in_review; no status change or worktree edits.

- 2026-11-09 — Read-only audit: #4 merged as77b76431 into divine/HARNESS-002-backlog-audit; #5 asb3aa2a54 into divine/TICKET-186-ticket-prefix. Both historical four-job CI runs succeeded. Subsequent explicit Git checks proved neither original merge reaches current develop or candidate integration113; see docs/reviews/TICKET-224/historical-evidence.md.

- 2026-11-09 — Final verify:quick passed lint, types and107 tests. Historical fixtures use distinct original head/no-ff merge; negative cases preserve ledger and ticket files. Independent source review clean. Real historical status recovery remains refused and tracked in TICKET-225.

## Activity log

- 2026-11-09 — new → todo — divine
- 2026-11-09 — todo → claimed — divine (codex)
- 2026-11-09 — todo → in_progress — divine (codex)
- 2026-11-09 — in_progress → in_review — divine (codex)
