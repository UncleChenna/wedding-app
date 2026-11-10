# Historical provenance audit

Audited 9 November 2026 against develop `ad730efa5676d3431aeeabec9f0101ce7e9ccb72`.
Original PRs and dirty historical worktrees were not changed. Historical ticket
statuses remain in_review until the reviewed recovery path is merged and verified.

## Exact Git evidence

- TICKET-186 implementation `8b2f965a492c5369aae9a921c15b14633f920f3a`
  and completed-criteria commit `48899eba105135410aafe6e380da71d172cc7e90`
  are exact ancestors of current develop.
- TICKET-187 implementation `2228ed09f8fa645daa7b7bfda975475516b76545`
  and original tested PR #5 head `2a187a9124efa351944c36e2cf98116435de8fc8`
  are exact ancestors of current develop.
- Both entered develop through PR #6 merge
  `229a2c36628b71e714cca69aeec0bbbbc8be6aca`, whose feature parent
  `0d2e878830786577672becc4d5f97f39cefa4bb3` descends from `2a187a91`.
- PR #4 tested head `b3aa2a54e0a2bb63444cd94c5583c9f22c7a2fd6` is the
  later PR #5 merge. Its parents are `48899eba` and `2a187a91`. Its **entire
  Git tree**, `a28b76dc05d8d30f721558a7886e342e52cc0b6f`, equals `2a187a91`'s
  tree exactly; `git diff 2a187a91 b3aa2a54` is empty.
- The original merge commits `77b76431` (#4) and `b3aa2a54` (#5) themselves
  are absent from develop ancestry. This fact remains recorded, not rewritten.

The original successful CI run links and immutable PR identities are preserved in
[TICKET-224 evidence](../TICKET-224/historical-evidence.md). Fresh recovery must
recheck those runs and a separately merged integration's exact-head full CI.

## Current requirement mapping

| Original criterion                                                      | Current evidence                                                                                                                 | Gap                                                           |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 186: canonical filenames, IDs, dependencies and boards                  | `scripts/tickets/model.ts` ID_PATTERN/formatId; ticket validation; render snapshot regression                                    | None in inspected implementation; fresh full CI required      |
| 186: allocation, lookup, ordering, commit validation                    | `scripts/__tests__/tickets.test.ts` allocation/lookup/ordering/commit cases; `scripts/harness/commit-rules.mjs`                  | Existing focused tests passed                                 |
| 186: old ledger and branch compatibility without duplicate claims       | `ledgerKey` retains WED keys intentionally; prefix tests and real two-clone claim race preserve one owner                        | Existing focused tests passed; historical worktrees untouched |
| 186: relevant tests and full verification                               | Current baseline prefix/workflow suite: 100 passed in 96.07s; PR148 full CI passed run42718977774                                | New recovery implementation requires its own final full CI    |
| 187: live backlog/roadmap/ticket/dependency/PRD review                  | `AGENTS.md` Mandatory check before coding                                                                                        | Present                                                       |
| 187: state scope/verification, avoid duplicate or blocked work, recheck | Same section's scope and final bullets                                                                                           | Present                                                       |
| 187: workflow skills and Claude inheritance                             | Both canonical skills link to the mandatory preflight; `CLAUDE.md` imports `@AGENTS.md`; agents:check passes seven shared skills | Present                                                       |

## Options and chosen boundary

A new forward-verification PR can prove the requirements today, but ordinary
`t:move done` still checks the original recorded PR's merge ancestry. Replacing
the original PR identity silently would discard provenance. Approximate patch or
selected-file equivalence also cannot certify the whole tested result.

The narrowly reviewed alternative is explicit `--source-commit <full-oid>` with
historical `--integration-pr`. The supplied commit must be an ancestor of the
original tested head, have its exact whole-tree identity, and be an ancestor of
the tested integration head and fresh develop. All existing ownership, status,
dependencies, criteria, original PR metadata, original CI and integration CI
checks remain. The activity records original head/merge, source/tree and both CI
runs, explicitly stating that original merge ancestry is not asserted.

This supports the retained source `2a187a91` for both historical tickets without
inferring ancestry from similar text. Sibling commits with identical trees,
one-file differences, missing integration ancestry and changed evidence must fail.
Independent review and verified merge precede any historical ledger mutation.

## Read-only live proof

The proposed evidence helper successfully verified both originals without writing
the ledger, using source `2a187a9124efa351944c36e2cf98116435de8fc8`, integration
PR #148 head `757de4f31479825fff4ea145b8f3e787c10e7c97`, merge/develop
`ad730efa5676d3431aeeabec9f0101ce7e9ccb72`, and successful full CI
[42718977774](https://github.com/UncleChenna/wedding-app/actions/runs/42718977774).
It independently reread original runs 39585515406 and 39580843257, metadata and
completed criteria. This is evidence inspection, not historical ticket closure.
