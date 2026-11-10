# Historical recovery evidence — 9 November 2026

Read-only audit against fetched develop `debc5b347a26b2f69f5ada2f69841bc66de6c858`.
No historical ledger status, PR target, branch or worktree was changed.

| Evidence                          | TICKET-186                                                                         | TICKET-187                                                                         |
| --------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Original PR                       | [#4](https://github.com/UncleChenna/wedding-app/pull/4)                            | [#5](https://github.com/UncleChenna/wedding-app/pull/5)                            |
| Original head                     | b3aa2a54e0a2bb63444cd94c5583c9f22c7a2fd6                                           | 2a187a9124efa351944c36e2cf98116435de8fc8                                           |
| Original merge                    | 77b76431a2dbf1a2b37a5a1ba2313664a023d434                                           | b3aa2a54e0a2bb63444cd94c5583c9f22c7a2fd6                                           |
| Original base                     | divine/HARNESS-002-backlog-audit                                                   | divine/TICKET-186-ticket-prefix                                                    |
| Successful ci.yml run             | [39585515406](https://github.com/UncleChenna/wedding-app/actions/runs/39585515406) | [39580843257](https://github.com/UncleChenna/wedding-app/actions/runs/39580843257) |
| Merge ancestor of fetched develop | **No (exit 1)**                                                                    | **No (exit 1)**                                                                    |

Both original ci.yml runs have four successful jobs: tickets valid, no AI
attribution in PR text, pnpm verify, and migrations + seed. This records only the
ci.yml workflow, not optional reviews outside it.

Candidate integration [#113](https://github.com/UncleChenna/wedding-app/pull/113)
merged into develop at `360914b7896554442659289f4a0bffccc5c8539f` with tested head
`89124bcba0f1a4e415a159a215aa59b8b5590526`. Its
[run 42592923916](https://github.com/UncleChenna/wedding-app/actions/runs/42592923916)
passed all five jobs, including invitation journey. Its head is an ancestor of its
merge, and its merge is an ancestor of fetched develop. However, original #4's
merge is **not** an ancestor of that tested head.

The new read-only evidence verifier refused with:

> Repair must contain the original merge and both must be reachable from fresh develop.

TICKET-186 and TICKET-187 remain in_review. Similar content and successful CI do
not replace the missing ancestry. TICKET-225 records the separately reviewed
provenance audit needed before any possible alternative recovery; TICKET-224 does
not implement a content-equivalence override.
