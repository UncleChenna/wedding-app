# TICKET-203 — Historical merged-PR evidence

2026-10-26 · divine · codex · `TICKET-203`

Completion now requires a merged PR commit reachable from freshly fetched develop, with acceptance criteria read from that exact fetched commit. Missing fetch/history/ticket content fails closed. Open PRs still require develop as their base; owner and lifecycle checks remain enforced. The refusal now explains that verified integration evidence is missing.

## Verification

Quick/full gates passed: 258 unit tests, production build, 155 browser passes and 17 conditional skips. Seven new local-Git regression cases and 24 existing ticket tests passed together (31 total); rerun after refusal-message update also passed. Initial regression run failed because the new evidence helper did not exist.

## Actual historical PR audit

At develop `fa36b007acc67b7e13eff1b07973a1bb937857d1`, PR #4 was MERGED into `divine/HARNESS-002-backlog-audit` with merge commit `77b76431a2dbf1a2b37a5a1ba2313664a023d434`; PR #5 was MERGED into `divine/TICKET-186-ticket-prefix` with merge commit `b3aa2a54e0a2bb63444cd94c5583c9f22c7a2fd6`. Each `git merge-base --is-ancestor <merge> FETCH_HEAD` returned 1. Both merged ticket files have ticked criteria, but that is not proof of ancestry. CLI completion attempts for TICKET-186 and TICKET-187 correctly failed and left their statuses unchanged. Do not claim either historical ticket is closed.

## Allocation recovery

An earlier invalid t:new consumed ID 202 without creating a definition; committing 203 exposed the sequence gap. Restored a template-based initial allocation record for 202 and cancelled it through the shared CLI ledger. Its file intentionally retains initial metadata because another ticket branch must not sync its status. `t:validate` passes with 203 definitions. The allocator defect remains TICKET-194, not part of this code change.

## Next

Integrate current develop, run the PR gate and publish the review. Merge only after required CI passes under the user's standing authorization. Historical tickets need separate evidence reconciliation; do not weaken the ancestry check.

## Integration status

Draft PR: https://github.com/UncleChenna/wedding-app/pull/37. Rebased onto typography merge `d22e37a7b88e6dfc33b265584833d1f79da98ee4`. The full-gate result above predates that rebase; final integration verification and t:pr remain required. TICKET-035 is undergoing clean-checkout verification after its existing Turbopack cache repeatedly omitted typography utilities; its CI passed. Await that merge before integrating its shared progress entry.

Next commands: fetch/rebase origin/develop after PR #36 merges, run quick/full gates and `pnpm t:pr TICKET-203`, ready PR #37, and verify required CI on its final head before merging. Keep TICKET-186/187 in_review unless new evidence satisfies the guard.
