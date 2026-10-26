# TICKET-194 — Validate before ticket allocation

2026-10-26 · divine · codex · `TICKET-194`

Build and parse a provisional ticket before mutating the ledger. Missing ownership and invalid enum values fail without reserving an ID. Creation status is limited to backlog/todo; later states use t:move. Allocation remains atomic; reserved IDs are never recycled.

Four new real-Git regression cases failed before the fix because the rejected request changed the ledger. All 28 ticket tests passed afterward, including the assertions that the ledger commit and lastId stay unchanged and the next valid request allocates TICKET-003.

Initial full gate: 262 unit passes, one existing worktree-base test timed out at its unchanged 5-second limit. The same test passed in isolation in 2.92 seconds. No assertions or timeouts changed. Rebased onto develop after PR #37 merged; integrated quick/full verification passed: 270 unit tests, production build, 157 first-attempt browser passes, six retry passes and 17 conditional skips. All six affected browser cases passed with one worker and no retries in 47.1 seconds.

Draft PR: https://github.com/UncleChenna/wedding-app/pull/38. Next: run t:pr, mark PR #38 ready after its full gate passes, wait for required CI on the exact final head, then merge and record done under the standing authorization. No database changes; optional worktree DB startup was cancelled. The completed TICKET-015 stack stop failed with StopContainerError through its data-preserving wrapper; no successful cleanup is claimed.

A filesystem write failure after a successful reservation can still leave an allocated ID. This fix addresses invalid input, not cross-system transactions or recycling historical IDs.
