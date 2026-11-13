# TICKET-066 verification integration

The existing disposable PostgreSQL guest-journey job adds the immutable offline
reconciliation tests and the authenticated ten-admission/reload/sync browser
journey after the private-snapshot checks. The existing camera job adds real
IndexedDB, actual emitted worker and persistent-browser cold-restart queue tests
in Chromium and WebKit. Its existing failure upload includes the new artifact
folder. Existing assertions, jobs, budgets and timeouts are unchanged.

This shared-worker/schema change selects full verification under TICKET-227's
path planner. The two opt-in environment flags are documented in `.env.example`.
CI parity tests pass locally; hosted checks remain pending publication.
