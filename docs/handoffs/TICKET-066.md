# TICKET-066 handoff

2026-11-12 — divine/codex — owned branch TICKET-066, draft PR164.

The live queue confirmed this ticket was ready after TICKET-065’s verified PR158 merge and CLI completion. Base: develop `2a0cf958`. One editor owns this worktree. The implementation remains unfinished; do not mark it ready or done.

## Implemented foundations

- Strict, bounded journal with immutable attempt UUIDs, original operator/device identity, no names, contacts or signed QR text, and transactional IndexedDB writes.
- Pending admissions from all retained operators consume this browser’s allowance. Committed server acknowledgements establish durable refresh barriers. A fresh canonical snapshot clears only captured barrier generations, including a previous operator’s barrier; pending evidence survives.
- Snapshot v2 adds only server-authenticated staff/device IDs. V1 remains readable but cannot authorize new queue writes.
- Sync checks same-origin requests and original actor identity. Reconciliation rechecks live authorization after row-lock waits; replay also binds staff and input method. Zero-person observations never increase admission counts.
- Worker runtime verifies signatures itself, waits for durable writes before returning local success, bounds upload duration/body size and preserves evidence on failure. Worker wiring is present but still needs focused race and real-browser verification.
- The public verifier uses the existing Zod mini named exports with identical strict schema semantics. Its measured helper is about 20 KB compressed, included in the scanner manifest/build identity. Classic service workers require imported scripts during installation; this cost must remain visible in TICKET-081’s initial-load budget.

## Evidence so far

- Queue policy: 12 tests pass; foundation coverage was 100% lines/branches.
- Real Chromium/WebKit IndexedDB: 10 tests pass, including reload, concurrent allowance, quota failure, corruption preservation and cross-operator barrier recovery.
- Snapshot actor contract: 16 tests pass. Sync HTTP/policy: 22 tests pass.
- Actual isolated PostgreSQL: 12 reconciliation tests pass, including changed operator/method replay, zero-person observations, mid-batch expiry and expiry across an actual invitation lock.
- Helper/token/manifest checks: 34 tests pass. Worker runtime: seven focused tests pass.
- Latest quick check: lint/types pass, 241 related tests pass, 13 conditional tests skipped. This is not full product verification.
- Reviewer024 independently approved the corrected allowance/barrier foundation. Server boundary and worker integration review remain pending.

## Local services and recovery

Native PostgreSQL on owned port29341 is stopped; its data directory is retained in ignored `.harness/temporary-postgres-path`. Initial `pnpm db:migrate` attempted the repository’s Supabase auto-start; it was interrupted, no owned containers remained, and direct `pnpm exec drizzle-kit migrate` against the explicit isolated native URL succeeded. Use the direct generator with the guarded owned URL for later native tests. No production or collaborator database was changed.

## Remaining work

Add worker lock/barrier/expiry regressions and real worker restart/upload tests; implement queue status, manual reconnect retry, durable local admission feedback and full offline-to-online journey. Preserve TICKET-063 manual selection and TICKET-068 current-result refresh contracts on integration. Never fabricate QR data for manual admission. Do not erase pending evidence on logout/expiry; TICKET-184 remains a separate recovery/retention task. UI evidence, required CI, final independent review and verified merge are still outstanding. Physical release checks remain in the existing release gates.

## 2026-11-12 mounted queue checkpoint

Integrated verified targeted-CI develop `af819983` as `8db11c3f`. Mounted explicit
count confirmation, local durable receipts, foreground/manual sync and retained
operator-scoped queue status. Production browser passed mobile/desktop (2 tests):
ten offline admissions survive a mid-flow reload, become exactly ten canonical
people in twenty observation/admission rows, and repeated sync adds no entry.
Actual emitted worker/IDB tests and persistent browser cold-restart proof pass.
Manual-selection adapter requires a real snapshot invitation, never a fabricated
QR; TICKET-063 integration remains pending its merge.

Review found stale 'waiting to sync' receipt text after delivery. A regression
failed before the correction; the receipt now describes historical local storage
and points to current sync/conflict status. Three component tests pass; final
browser recapture is pending. Earlier 24 screenshots were independently reviewed
without layout defects; final copy must be recaptured.

New migration0031 binds immutable upload intent to a digest. See the migration
review for actual 13-test database, two-run migration, RLS26 and seed repeatability
evidence, and the explicit legacy NULL-digest limitation. Final integrated build,
updated snapshot browser assertions, hosted CI and final review remain pending.
Physical-device release checks remain in114/163/201. Initial service-worker wire
cost includes the public crypto helper; TICKET-081's200KB budget is not certified.

Final-copy browser rerun passed2/2 in19.4s and refreshed all24 captures. One earlier
mobile run showed Camera stopped immediately after going offline; desktop passed.
A diagnostic rerun added only static asset paths and controller/online booleans,
then both passed. No root cause or product fix is claimed for that isolated
failure. Preserve `/tmp/TICKET-066-final-browser-clean-fixture.log` and
`/tmp/TICKET-066-diagnostic-browser.log`. Latest quick107related tests and CI
parity pass. Next integrate verified0639c24504f and adapt manual queue UI, then
rerun affected compatibility checks and hosted fullCI.

## Manual integration and review follow-up

Verified063 integrated as45fc93c9. Manual cached selections now carry queue
capability only from a v2 snapshot, record an observation before display and use
real invitation IDs for explicit local count confirmation. Legacy snapshots stay
read-only. A deferred-observation regression reproduced a stale green verdict
when the worker found all places used; both QR/manual paths now reject divergent
normalized verdicts, preserving unknown/replaced journal vocabulary. Fourteen
related tests pass after the fix. Final browser fixture uses unique synthetic
names because retained audit fixtures legitimately contain earlier households.

Latest combined browser attempt failed: mobile initial camera stopped again;
desktop reached the tenth manual selection but its non-unique fixture name matched
six retained households. The fixture identity is corrected, not the selector
relaxed. Failure-only static asset/controller diagnostics now persist to disk.
No root cause for the mobile failure is claimed. Next integrate verified068,
rebuild and diagnose/run final combined browser checks, then publish hosted CI.
