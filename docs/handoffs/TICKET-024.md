# TICKET-024 handoff

2026-11-04 · divine · codex · branch TICKET-024.
Base: develop df8a970bc88b2c7b6664f26190a6c49abd8d3e1e.
Managed worktree: .worktrees/TICKET-024; project wedding-87b768edd6c7,
DB port 34861, dev 34870, Playwright 34871.

Claimed from the live queue after TICKET-031 was marked blocked for its outstanding
review disposition. TICKET-072 belongs to another owner and was not touched.
Read ticket dependencies, PRD CHK-2/3/5/6/7, ADRs 0003/0010/0017/0020, current
schema and TICKET-058/173 consumer contracts. No product code is changed yet.

Plan: docs/plans/2026-11-04-TICKET-024.md.
Concrete storage review: docs/reviews/TICKET-024/storage-contract.md.

Key findings: preserve reported physical admission separately from canonical
allowance; preserve the legacy check_ins archive; database counter checks must use
an authoritative RSVP rather than a client-supplied limit. Applied 0001 only supports
an empty scaffold, so a fresh migration run alone cannot establish populated legacy
preservation. Do not edit 0001 or silently broaden its approval.

TICKET-031's unmerged PR84 currently reserves migration 0011. Do not generate a
competing number. Source/tests and the migration design can proceed before final
integration, but generated paths require a settled base and exact-path authorization.

The managed database startup is still being observed; no successful database test,
new migration, production application or completion is claimed. Next: confirm startup,
write failing storage/preservation tests, implement the reviewed schema and guards,
settle the migration base, generate and verify disposable migrations, then request
only the necessary exact-path approval with concrete SQL and results.

## Work saved before returning to approved reviews

Proposed additive Drizzle schema and initial opt-in tests are now present. These
are incomplete: no append-only/cross-table SQL guards or migration files exist.
Quick gate passes lint, types and 45 tests (34 opt-in skips). The attempted DB suite
was refused by the target guard before any assertions, because setup had not yet
rewritten the copied local settings. Do not treat this as a schema regression test.

First stack startup definitively failed and removed its containers. A second
`pnpm db:start` attempt is live (session63045); observe it before retrying. The
user approved PR83's merge and TICKET-031's review with physical-device release
checks retained, so finish those reviews before resuming this editing ticket.

Both isolated startup attempts are now terminal failures. No startup process is
still running. Draft PR: https://github.com/UncleChenna/wedding-app/pull/85.
The CLI records this ticket as blocked; schema/tests are pushed in 2749718 and the
blocker in 9258e05. Resume only after diagnosing stack health and settling PR84's
migration base. No database tests or migration generation succeeded.

## Resumed proposal verification — 2026-11-04

Owner divine, branch TICKET-024, draft PR85. The isolated stack recovered after
parking the completed TICKET-031 stack with backup. Applied existing 0000–0010;
initial tests failed for missing new tables. CLI resumed in_progress in d9ca7b6.
Additive schema, guard/backfill SQL proposals, export fixture and six opt-in tests
now exist. Four guard cases passed together. Latest run: three passed (both populated
current/bootstrap preservation cases and allowance/RSVP guard), three failed only
with CONNECT_TIMEOUT. Logs are in artifacts/TICKET-024/proposal-*.log. Proposals
execute only in temporary schemas inside rolled-back transactions; no final
TICKET-024 migrations exist. Fixture household_name and a PL/pgSQL variable
reference were corrected after reproduced failures.

PR84 is now merged as 549b86a; migration 0011 collision is resolved. Next: checkpoint
this proposal, integrate freshly fetched develop, generate final migrations through
Drizzle, test concurrency/repeat migration/RLS and request exact-path commit
authorization with concrete evidence. Local connection instability remains; avoid
blind parallel stack starts or stopping another owner's stack. A harness follow-up
should coordinate capacity for full stacks and verification. No production action.

Latest checkpoint quick gate: lint, typecheck and 45 related tests passed; 38 opt-in tests skipped.

## Prepared develop integration — 2026-11-04

Checkpoint 534f0f2 is pushed and PR85 updated. A conflict-free merge of develop
549b86a is prepared but uncommitted pending exact-path authorization for unchanged
0011 SQL/snapshot/journal and this worktree's approval record. All three staged
files match develop byte-for-byte. Integrated quick verification passes lint,
types and 113 tests (44 opt-in skips), logged in integrated-quick.log. Do not
start another merge or discard the prepared index. Next: record the requested
approval when received, commit/push the integration, then generate and verify
TICKET-024's own migrations. No new migration authorization has been granted.

## Additional tests while authorization is pending — 2026-11-04

Expanded the integration suite to nine tests; all pass together in
artifacts/TICKET-024/proposal-concurrency.log. New coverage verifies all five results,
excess-insert rollback, retained conflicting offline reports, restrictive actor
references, bulk evidence/source removal rejection, and competing transactions for
the final admission. The concurrent fixture creates and removes only its own random
synthetic schema; other cases roll back all changes. No public data is changed.
These test/doc edits remain local because the prepared merge cannot be partially
committed while its protected-file authorization is pending. The earlier checkpoint
534f0f2 remains pushed. Record approval, commit the integration and these tests,
then push; do not discard the index or this working tree.

Expanded quick gate completed successfully: lint, types, 113 related tests passed,
53 opt-in skips. The nine admission database tests were run explicitly and passed
separately; their default skip in verify:quick does not replace that evidence.
No verification process remains running. Protected-file approval is still pending.

## Parked pending approval — 2026-11-04

CLI records the exact-path approval blocker in the shared ledger without --push:
the prepared merge cannot be committed yet. All pending edits and staged develop
integration are retained here. Moving to the next ready ticket, TICKET-032, in its
own worktree; do not edit TICKET-024 concurrently. Resume this ticket only after
its approval arrives and the active ticket has been handed off safely.

## Approved base integration — 2026-11-08

User approved the prepared merge and exact-path authorization for unchanged
migration0011 SQL/snapshot/journal. All three match MERGE_HEAD549b86a exactly;
no unresolved conflicts. Fresh quick gate passes lint, types and related tests.
The index audit against MERGE_HEAD shows only ten TICKET-024 files differ: its
handoff, plan, PR body, three proposal/contract files, admission test, fixture,
admission schema additions and ticket. Every other staged file is inherited
unchanged from that approved merged develop base, including CI.
No new migration generation or production action is approved by this exception.
