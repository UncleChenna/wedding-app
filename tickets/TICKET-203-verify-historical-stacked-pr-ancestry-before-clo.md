---
id: TICKET-203
title: Verify historical stacked PR ancestry before closing tickets
epic: foundations
status: in_progress
priority: high
estimate: S
labels: [infra, test]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-203
pr: ""
created: 2026-10-26
updated: 2026-10-26
started: 2026-10-26
completed: ""
reason: ""
resume_to: ""
---

# TICKET-203: Verify historical stacked PR ancestry before closing tickets

## Context

TICKET-186 and TICKET-187 remain in_review because their merged PRs targeted historical stacked branches. The current completion guard accepts only direct develop merges. See [ticket workflow](../docs/tickets.md). GitHub PRs #4 and #5 are merged, but closure must prove their merged work actually reached develop rather than trusting the merged flag alone.

## Scope

- Verify merged historical PR ancestry against freshly fetched origin/develop before allowing completion.
- Preserve owner and merged acceptance-criteria checks; reconcile eligible historical tickets through the CLI.

## Out of scope

- Changing review policy, rewriting Git history, accepting unmerged/unreachable changes, or overriding another owner.

## Acceptance criteria

- [x] A merged stacked PR can close only when its merge commit is proven reachable from freshly fetched develop.
- [x] Open, closed-unmerged, unrelated, unreachable and unavailable-history cases refuse completion.
- [x] Direct develop merges, owner checks and merged acceptance-criteria validation retain existing behavior.
- [x] TICKET-186 and TICKET-187 close through the CLI only if the evidence satisfies the new checks.

## Test plan

- Unit: mocked PR metadata plus a local Git graph covering direct, stacked, unreachable and fetch-failure cases.
- Integration: existing ticket workflow tests and full pnpm verify.
- Manual: read GitHub PR #4/#5 metadata and record develop ancestry proof before closure.

## Files likely touched

- scripts/tickets.ts and ticket PR helpers/tests; docs/tickets.md; per-ticket handoff.

## Notes / decisions

- 2026-10-26: Fresh ancestry and same-commit criteria checks implemented; 31 focused tests and full gate pass (258 unit, 155 browser, 17 skips). PR #4/#5 merge commits are not reachable from inspected develop; CLI correctly refuses both historical closures. Conditional closure criterion is satisfied by refusal, not by marking those tickets done. Exact evidence is in docs/handoffs/TICKET-203.md.

- 2026-10-26: Discovered during the user-authorized backlog completion run. Do not bypass the existing guard while this ticket is pending.

## Activity log

- 2026-10-26 — new → backlog — divine
- 2026-10-26 — backlog → todo — divine
- 2026-10-26 — todo → claimed — divine (codex)
- 2026-10-26 — todo → in_progress — divine (codex)
