---
id: TICKET-225
title: Audit rewritten historical ticket provenance
epic: foundations
status: done
priority: medium
estimate: M
labels: [infra, test, docs]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-225
pr: https://github.com/UncleChenna/wedding-app/pull/150
created: 2026-11-09
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-225: Audit rewritten historical ticket provenance

## Context

TICKET-224's strict recovery verifier refuses TICKET-186/#4 and TICKET-187/#5:
original merges 77b76431 and b3aa2a54 are not ancestors of develop debc5b34.
Their successful historical CI and similar current content are insufficient to
prove ancestry. See [ticket recovery](../docs/tickets.md#historical-stacked-merges).

## Scope

- Trace original patches and later integrations using read-only Git/GitHub evidence.
- Review whether an explicit content-based provenance mechanism can certify every
  original acceptance criterion without weakening ordinary completion checks.
- If justified, propose and test a separately reviewed recovery mechanism; otherwise
  document the unresolved evidence and keep the original statuses unchanged.

## Out of scope

- No force status updates, fabricated ancestry, retargeting merged PRs, history
  rewriting, or edits/deletion of historical dirty worktrees.

## Acceptance criteria

- [x] Each original criterion has an auditable mapping to current tested content, or an explicit evidence gap.
- [x] Any proposed recovery checks identity, ownership, dependencies, complete criteria and exact successful CI; negative tests reject unrelated or partial content.
- [x] No historical ticket is marked done until independent review accepts sufficient evidence and a verified CLI path exists.

## Test plan

- Manual: read-only Git patch/history inspection and immutable PR/run evidence.
- Unit/integration if a recovery mechanism is implemented: temporary Git regressions for equivalent,
  partial, unrelated and changed evidence; verify:quick and full CI.

## Files likely touched

- docs/reviews/TICKET-225/, scripts/tickets/reconcile.ts and focused tests if justified.

## Notes / decisions

- Created from TICKET-224's real ancestry refusal, not from failed test infrastructure.
- Preserve TICKET-186 and TICKET-187 in_review while evidence remains insufficient.
- 2026-11-09 — Exact retained source/whole-tree audit and independent source review support explicit historical source mode. Positive regression failed before implementation; final quick passed lint/types and119 tests. Read-only real proof passed for both originals against PR148. Historical statuses stay unchanged until this mechanism's verified merge and CLI closeout.

## Activity log

- 2026-11-09 — new → todo — divine
- 2026-11-09 — backlog → todo — divine
- 2026-11-09 — todo → claimed — divine (codex)
- 2026-11-09 — todo → in_progress — divine (codex)
- 2026-11-09 — in_progress → in_review — divine (codex)
