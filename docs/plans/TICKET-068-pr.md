# Ticket

TICKET-068

# Summary

Keep each gate scanner current after another device records an admission, using the private station broadcast contract and authoritative snapshot refresh. Polling remains independent of WebSocket/token retry state.

# Changes

- Initial independent controller: gate-only subscription, known-change invalidation callback, five-second fallback polling, refusal cleanup and late-callback fencing.
- Online admission and offline reconciliation now publish the existing minimal gate notification only after a new scan-event insert, inside the same transaction. Replayed event IDs never publish again.
- TICKET-065 is still a prerequisite. Its private snapshot, worker/session safety barriers and pending admission intents will be preserved during integration.

# Acceptance criteria and evidence

- [ ] A committed admission on device A is reflected on device B within two seconds in two real browser contexts.
- [ ] With Realtime blocked, polling updates the authoritative cache within fifteen seconds.

# Verification

- Six controller behavior tests failed against the initial stub, then passed after implementation (1.19s).
- Expanded controller lifecycle suite: nine passed.
- Actual isolated Supabase: two missing-broadcast tests failed before implementation, then fifteen admission/reconciliation/broadcast tests passed, including rollback, replay and concurrency. Existing private-channel authorization/WebSocket suite: four passed.
- Scanner visible-refresh seam: fourteen existing/new tests pass, including no-rescan updates, late old-QR/revision fencing and exact request reuse across a pending/uncertain admission. This is unit evidence, not the required browser timing proof.
- Parent independent review of this transaction/controller foundation found no blockers. Actual snapshot/UI integration, production browser timing and final combined verification/review remain pending.

# Risks and rollout

Draft ahead of TICKET-065. No production database changes or messages have been sent. Notification payloads must remain identifiers/counts only and must never be treated as canonical admission data. Pending admission intents must survive cache changes. Physical-device and venue-network release checks remain unverified.

# Screenshots

Pending the integrated scanner UI checks.

# UI checklist

Pending; this foundation is not UI completion.

# Harness changes, if any

None.
