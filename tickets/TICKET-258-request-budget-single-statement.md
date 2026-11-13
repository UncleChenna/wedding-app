---
id: TICKET-258
title: Decide request budgets in one statement instead of a held transaction
epic: reliability
status: in_review
priority: high
estimate: S
labels: [backend, performance, reliability]
module: shared
owner: UncleChenna
agent: claude
blocked_by: []
blocks: []
branch: TICKET-258
pr: ""
created: 2026-11-13
updated: 2026-11-13
started: 2026-11-13
completed: ""
reason: ""
resume_to: ""
---

# TICKET-258: Decide request budgets in one statement instead of a held transaction

## Context

Found by the TICKET-137 load test. Ordering (and lookup, PIN and lost-link) requests share one
`request_budgets` row per network. At the venue every guest is behind the same router, so all
orders share one row. `consumeRequestBudget` locked that row in a transaction and then made three
round trips before committing. During load-test stalls, `pg_stat_activity` showed every other
connection waiting on that row's lock while the holder sat "idle in transaction"; with the app's
pool of 10 connections all waiting, unrelated routes such as gate scans also stalled.

## Scope

- Decide and record each request with one `insert … on conflict do update … where … returning`
  statement: the update applies only while budget remains, so no returned row means refused.
- Keep the expired-row cleanup statement and all existing budget semantics.

## Acceptance criteria

- [x] No transaction is opened to decide a request (unit).
- [x] Existing atomic budget tests still pass, including concurrent pools never overshooting,
      no denial-window extension and reset after expiry (integration).

## Notes / decisions

- 2026-11-13: A/B under synthetic CPU stress could not reproduce the multi-minute stall on demand
  (the old code passed under that stress too), so this is hardening of the observed lock queue,
  not a proven cure. Rerun the TICKET-137 load test on staging after both merge.
