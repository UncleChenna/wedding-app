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
pending. See docs/reviews/TICKET-031/migration-approval.md. Do not commit generated
files before approval. Quick verification passes lint, types and 49 related tests
(34 opt-in tests skipped); the 16 new credential/session tests passed separately.
Full application verification and browser checks remain outstanding.

Next: connect the attempt/session primitives to live credential/role/revocation
checks and staff entry screens.
Read installed Next docs before route/action changes. Prepare a concrete migration
proposal and obtain exact-path authorization for generated output. No production
database application has been performed. Administrative
staff creation stays in TICKET-096. This ticket is not complete.
