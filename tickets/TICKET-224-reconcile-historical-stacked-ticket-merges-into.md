---
id: TICKET-224
title: Reconcile historical stacked ticket merges into develop
epic: foundations
status: in_progress
priority: high
estimate: M
labels: [infra, test, docs]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-224
pr: ""
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
before the current develop-only workflow. Their changes are present in develop but
their ledger states remain in_review. Existing completion/reconciliation requires
the original PR base to be develop. See [ticket workflow](../docs/tickets.md).

## Scope

- Add an explicit evidence-based CLI recovery for historical stacked merges.
- Prove original merge ancestry into a separately tested, merged develop integration
  and fresh origin/develop; verify completed criteria and exact-head successful CI.
- Preserve ownership, dependency, clean evidence and normal direct-merge checks.
- Reconcile the two historical tickets only after the new path is verified and merged.

## Out of scope

- No Git history rewrite, PR retargeting, force status override or CI bypass.
- No deletion or edits to historical dirty worktrees. No product or database changes.

## Acceptance criteria

- [ ] Real Git regressions accept an owned historical stacked merge only when its merge commit is an ancestor of the independently tested integration and fresh develop, with complete original criteria.
- [ ] Unmerged/unrelated PRs, missing ancestry, incomplete criteria, wrong owners, unfinished dependencies and stale/pending/failed CI refuse without changing the ledger.
- [ ] Original and integration PR/head/CI/develop evidence is preserved in the ledger activity; original PR identity remains unchanged.
- [ ] Existing direct completion and repair reconciliation continue to pass their regressions.
- [ ] Documentation explains the explicit recovery command; TICKET-186 and TICKET-187 are reconciled through it only after verified merge, preserving historical worktrees.

## Test plan

- Unit/integration: temporary Git histories and controlled GitHub evidence for valid stacks and all refusal cases, including a changed CI head/run during verification.
- CLI: assert refusal leaves ticket/ledger unchanged; successful recovery records exact evidence.
- Gate: verify:quick and full CI. Inspect actual #4/#5 merge ancestry and acceptance criteria before any status change.

## Files likely touched

- `scripts/tickets/reconcile.ts`, ticket CLI/helpers and focused tests.
- `docs/tickets.md`, this ticket and its PR/handoff evidence.

## Notes / decisions

- 2026-11-09 — Read-only audit: #4 merged as77b76431 into divine/HARNESS-002-backlog-audit; #5 asb3aa2a54 into divine/TICKET-186-ticket-prefix. Both historical four-job CI runs succeeded. Current-base ancestry and a suitable tested integration still need verification; this is not authorization to fabricate completion evidence.

## Activity log

- 2026-11-09 — new → todo — divine
- 2026-11-09 — todo → claimed — divine (codex)
- 2026-11-09 — todo → in_progress — divine (codex)
