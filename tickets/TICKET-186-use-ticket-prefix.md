---
id: TICKET-186
title: Use TICKET as the ticket prefix
epic: foundations
status: in_review
priority: urgent
estimate: M
labels: [infra, test]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: divine/WED-186-rename-the-ticket-prefix-from-wed-to-ticket
pr: https://github.com/UncleChenna/wedding-app/pull/4
created: 2026-10-21
updated: 2026-10-21
started: 2026-10-21
completed: ""
reason: ""
resume_to: ""
---

# TICKET-186: Use TICKET as the ticket prefix

## Context

The requested naming convention is TICKET-NNN. Preserve the backlog and coordination guarantees described in [the ticket workflow](../docs/tickets.md) and [PRD](../docs/prd.md).

## Scope

- Rename ticket files, IDs, references, generated boards, examples and parser/commit tooling.
- Preserve live claims and active legacy branches through a compatibility boundary.

## Out of scope

- Renaming existing remote branches or changing another owner's status.

## Acceptance criteria

- [x] All ticket filenames and canonical IDs use TICKET-NNN; dependencies and generated boards validate.
- [x] CLI allocation, lookup, ordering and commit validation support the new prefix.
- [x] Existing ledger claims and legacy branch transitions remain compatible without duplicate claims.
- [x] Relevant tests and the full verification gate pass.

## Test plan

- Unit: ID parsing/formatting, old-ledger overlay, legacy branch compatibility and commit validation.
- Integration: existing two-clone claim race, live read-only claim inspection, render idempotence and full pnpm verify.

## Files likely touched

- tickets/, scripts/tickets*, scripts/harness/commit-rules.mjs, docs/, shared instructions and skills.

## Notes / decisions

- Preserve the shared ledger's existing keys during rollout so older active worktrees cannot acquire duplicate claims.

- 2026-10-21 — All 186 filenames and IDs migrated; canonical CLI, boards and instructions updated. Existing ledger keys and legacy branches preserved. Full verification passed: 73 unit tests, build, 17 smoke passes and 7 existing skips.

## Activity log

- 2026-10-21 — new → todo — divine
- 2026-10-21 — todo → claimed — divine (codex)
- 2026-10-21 — todo → in_progress — divine (codex)
- 2026-10-21 — in_progress → in_review — divine (codex)
