# TICKET-061 handoff

2026-11-09 · divine / codex · branch `TICKET-061` · PR [144](https://github.com/UncleChenna/wedding-app/pull/144).

Base: `2df977c6a1205e01da27f11b43637dcae7dc6bba` (TICKET-060). TICKET-108 owns the session/offline wrapper and must merge before final integration of this ticket. Do not copy its unmerged shared auth/session files.

Implemented a strict same-origin, auth-first admission POST; local signed-pass verification; actor/device/credential and invitation locking; live reauthorization after waits and immediately before insertion. Existing immutable scan-event triggers own the canonical counter update. Replays bind the original actor, invitation, source and count and return historical receipts, never fresh permission to enter. No migration.

Scanner now offers a remaining-allowance count stepper. Only the explicit committed action shows Welcome. Lost responses retain the exact request identity/count and lock the next-pass action until retry resolves; duplicate receipts expressly prohibit admitting again. Initial camera action is above the idle viewfinder. No Next server-action imports in browser Scanner; TICKET-108 standalone bundling remains supported.

Evidence so far:

- Red tests recorded missing implementation before edits.
- Focused unit suites55 passed; quick lint/types passed.
- Isolated PostgreSQL16 database suite5/5 passed:2of4, exact replay, concurrent duplicate requests, competing scanners, revocation and post-lock session expiry.
- Production build passed.
- Actual production browser2/2 passed28.6s: partial count, rescan remaining, real committed/lost response recovery, competing final-place refusal. Four themes,375/768/1280, axe, overflow and44px targets;120 screenshots in docs/reviews/TICKET-061/mobile and desktop.
- Independent backend reviewer found no blocking issue; UI review and final keyboard assertions/full coverage in progress.

Owned native PostgreSQL36261 only: temporary cluster path is in ignored `.harness/temporary-postgres-path`. Initial public-table count was zero; unchanged migrations applied. Synthetic append-only evidence is retained, not deleted. Stop only this cluster with pg_ctl and preserve its directory after testing. This is not Supabase Auth/Realtime, physical device or production-database evidence.

Next: finish independent UI review and coverage, run existing scanner regression, update PR evidence, integrate verified merged TICKET-108, then quick/full CI on final head. Retain physical device release gates in TICKET-201; do not mark done before checks and merge.
