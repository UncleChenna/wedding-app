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
