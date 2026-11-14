# TICKET-137 load test: what the local runs show

Runner: `pnpm load:test` (scripts/load/run.ts). Three gate scanners read and admit every attending
invitation's signed pass while 30 tables each send a food and drink order, against a local
production build. Afterwards the runner checks the database to confirm nothing was lost.

## Runs on 2026-11-13

| Run                                                                                    | Machine                                           | Result                                                                                              |
| -------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [PRD pace: 45-minute gate, 5-minute orders](TICKET-137-load-2026-11-13.md)             | Heavily loaded by other work (load average 10–19) | FAIL: scans and orders stalled for minutes around 2½–3½ minutes in; 4 orders refused as unavailable |
| [Compressed: 3-minute gate, 1-minute orders](TICKET-137-load-compressed-2026-11-13.md) | Quiet (load average 3–5)                          | PASS: scan p95 95 ms, admit 64 ms, order 55 ms, order to board 151 ms                               |

In every run, every admission and every created order reached the database. Nothing was lost.

## Why the loaded runs stalled

During a stall, `pg_stat_activity` showed every app connection waiting on one row lock in
`request_budgets`, the shared ordering rate-limit row (`Lock:transactionid` on
`insert into request_budgets`), while the connection holding it sat `idle in transaction`. The
budget check held that lock across several app round trips. When the server was slow, every order
queued behind it and the pool of 10 connections ran out, so gate scans, which don't use the
budget, waited too. At the venue every guest is behind the same router and shares that row.

TICKET-258 makes the budget check a single statement. With that build the compressed run passed
with scan p95 51 ms and order to board 143 ms. A synthetic CPU-stress A/B could not reproduce the
multi-minute stall on demand, so treat TICKET-258 as hardening of the observed lock queue.

## Still to do

The acceptance run is on isolated staging data (TICKET-149), at PRD pace, after TICKET-258 merges:
`pnpm load:test --staging --base-url https://… --gate-minutes 45 --order-minutes 5`.
