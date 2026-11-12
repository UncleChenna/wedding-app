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
