# TICKET-061 handoff

2026-11-09 · divine / codex · branch `TICKET-061` · PR [144](https://github.com/UncleChenna/wedding-app/pull/144).

Base: `2df977c6a1445e01da27f11b43637dcae7dc6bba` (TICKET-060). TICKET-108 owns the session/offline wrapper and must merge before final integration of this ticket. Do not copy its unmerged shared auth/session files.

Implemented a strict same-origin, auth-first admission POST; local signed-pass verification; actor/device/credential and invitation locking; live reauthorization after waits and immediately before insertion. Existing immutable scan-event triggers own the canonical counter update. Replays bind the original actor, invitation, source and count and return historical receipts, never fresh permission to enter. No migration.

Scanner now offers a remaining-allowance count stepper. Only the explicit committed action shows Welcome. Lost responses retain the exact request identity/count and lock the next-pass action until retry resolves; duplicate receipts expressly prohibit admitting again. Initial camera action is above the idle viewfinder. No Next server-action imports in browser Scanner; TICKET-108 standalone bundling remains supported.

Evidence so far:

- Red tests recorded missing implementation before edits.
- Focused unit suites55 passed; quick lint/types passed.
- Isolated PostgreSQL16 database suite5/5 passed:2 of 4, exact replay, concurrent duplicate requests, competing scanners, revocation and post-lock session expiry.
- Production build passed.
- Actual production browser2/2 passed33.0s: partial count, rescan remaining, real committed/lost response recovery, competing final-place refusal. Four themes,375/768/1280, axe, overflow and44px targets;144 screenshots in docs/reviews/TICKET-061/mobile and desktop.
- Independent backend reviewer found no blocking issue; UI review and final keyboard assertions/full coverage in progress.

Owned native PostgreSQL 36261 only: temporary cluster path is in ignored `.harness/temporary-postgres-path`. Initial public-table count was zero; unchanged migrations applied. Synthetic append-only evidence is retained, not deleted. Stop only this cluster with pg_ctl and preserve its directory after testing. This is not Supabase Auth/Realtime, physical device or production-database evidence.

Next: finish independent UI review and coverage, run existing scanner regression, update PR evidence, integrate verified merged TICKET-108, then quick/full CI on final head. Retain physical device release gates in TICKET-201; do not mark done before checks and merge.

## Review repairs — 2026-11-09

- A stalled transport is bounded to eight seconds, including response-body consumption. Headers/body stall regressions preserve the original intent for retry; unmount aborts transport and removes the timer.
- Independent review reproduced a phone visibility bug: clearing the result could discard an unresolved admission ID. The scanner now stops capture/audio while keeping the admission component mounted. A scanner-level red/green regression and actual committed-then-lost-response browser case prove hidden/visible transitions preserve the same request.
- Invalid, revoked, conflict and expired-session submit results use fixed danger colours and a cross icon; already-used and waiting cases remain amber. A revoked-after-check browser case covers every theme.
- Final scoped quick passes lint/types and18 related tests. Actual production browser2/2 passes 33s. Existing unchanged camera regression2/2 passes 1.2m. The full unit rerun before the visibility repair passed 1677 tests with 190 conditional skips; coverage 98.30% lines / 98.51% branches. Final integrated suite remains required after TICKET-108.
- Owned native PostgreSQL 36261 is stopped with its synthetic data directory preserved; the database slot was released to TICKET-123. No production operation.
