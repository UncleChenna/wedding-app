# TICKET-031 handoff

2026-11-03 · divine · codex · branch TICKET-031.

Started from develop df8a970 after TICKET-172 merged. Live ledger confirms the
claim and in-progress status. Isolated stack wedding-5f49479b1ba7 is running;
database port 27861, app 27870, Playwright 27871.

Implemented only the server-only credential helper and its behavioural tests.
Fresh random salts, asynchronous scrypt, constant-time digest comparison and a
bounded supported envelope prevent stored parameters from requesting excessive
work. Invalid input is rejected without normalization. No PIN or hash is logged.
The new suite first failed for the missing implementation, then all 12 tests
passed. Full application verification and browser checks remain outstanding.

Next: implement persistent atomic per-device attempt accounting, signed session
binding with live credential/role/revocation checks, and staff entry screens.
Read installed Next docs before route/action changes. Prepare a concrete migration
proposal and obtain exact-path authorization for generated output. No new
migration or production database application has been performed. Administrative
staff creation stays in TICKET-096. This ticket is not complete.
