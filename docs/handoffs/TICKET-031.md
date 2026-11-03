# TICKET-031 handoff

2026-11-03 · divine · codex · branch TICKET-031.

Started from develop df8a970 after TICKET-172 merged. Live ledger confirms the
claim and in-progress status. Isolated stack wedding-5f49479b1ba7 is running;
database port 27861, app 27870, Playwright 27871.

Draft PR: https://github.com/UncleChenna/wedding-app/pull/84.

Implemented the server-only credential helper and its behavioural tests.
Fresh random salts, asynchronous scrypt, constant-time digest comparison and a
bounded supported envelope prevent stored parameters from requesting excessive
work. Invalid input is rejected without normalization. No PIN or hash is logged.
The new suite first failed for the missing implementation, then all 12 tests
passed. Session signing adds four passing tests for device/key binding, expiry,
tampering and invalid issuance. Persistent attempt storage adds two passing real
database tests, including eight simultaneous attempts executing only five checks.
Migration 0011 is generated and applied only to this isolated stack. A repeated
migration preserves all counts (12 migration records); all 15 public tables have
RLS enabled. Exact-path commit/authorization-record approval was requested and is
approved by the user on 2026-11-03 and recorded in the ignored authorization file.
See docs/reviews/TICKET-031/migration-approval.md. Quick verification passes lint, types and 49 related tests
(34 opt-in tests skipped); the 16 new credential/session tests passed separately.
Full application verification and browser checks remain outstanding.

The authentication service now checks role, credential version and device/staff
revocation live, caps session expiry at the approved venue-local 06:00 cutoff,
and returns no PIN hashes. Three isolated database tests pass, including real
sign-in and live revocation. All 21 credential/session/cutoff unit tests pass;
the latest quick gate passes. The first typecheck caught generic inference
including undefined; an explicit result type fixed it without weakening strictness.
Cookie/action wiring and UI remain to implement. Installed Next cookies docs were
read; async reads need Suspense and cookie writes must be actions/handlers.

Next: connect the attempt/session primitives to live credential/role/revocation
checks and staff entry screens.
Read installed Next docs before route/action changes. Prepare a concrete migration
proposal and obtain exact-path authorization for generated output. No production
database application has been performed. Administrative
staff creation stays in TICKET-096. This ticket is not complete.
