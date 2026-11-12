# Ticket

Ticket: TICKET-066

# Summary

Offline scanner checks currently remain read-only. This ticket will record offline attempts durably before showing admission success and upload them exactly once when the original operator reconnects. The queue must survive reload, expired private snapshots and failed uploads.

# Changes

Planned implementation, not completed evidence:

- A separate worker-owned IndexedDB queue stores immutable attempt UUIDs and original staff/device identity. Queue writes and local pending allowance updates commit together under the existing scanner publication lock.
- Version2 private snapshots add only server-verified staff/device IDs. Version1 snapshots remain readable but cannot authorize queue writes. Session expiry removes private snapshots without deleting unsynced evidence.
- Atomic committed acknowledgements remove pending events and retain an allowance barrier until a trustworthy refreshed snapshot accounts for them. A crash or stale snapshot must never restore already-used local places.
- Same-origin uploads require the current authenticated identity to match the queued original actor. Reconciliation preserves existing per-event transactions, strengthens replay identity, and checks current authority after lock waits.
- The UI distinguishes local recorded admission from server acknowledgement, shows pending count, and supports foreground and manual retry without Background Sync. Invalid, used and revoked attempts are retained too.

# Acceptance criteria and evidence

All implementation criteria remain pending. Verify durable writes before positive feedback, ten admissions surviving reload, duplicate reconnects without double admission, storage failure recovery, original-actor mismatch, rejected/partial acknowledgements and visible manual retries. Follow ADR0020: stale is a warning, expiry is authoritative, unknown signed passes require an explicit name check, and disconnected revocations are not immediate.

# Verification

No implementation verification yet. Start from verified develop2a0cf958 containing TICKET-065. Planned focused pure/IndexedDB/HTTP tests, isolated PostgreSQL concurrency tests and real Chromium/WebKit offline-to-online browser evidence. Use normal quick checks and required CI; do not repeat broad suites without a new failure or concern.

# Risks and rollout

No production data or paid service is involved. Pending evidence must never be erased by logout, a changed operator, private-cache expiry or a worker upgrade. Actor IDs are private authorization metadata, not credentials. Conflicts remain visible and retained for TICKET-067; this ticket does not resolve disputes. Physical phone checks remain mandatory release gates.

# Screenshots

Pending affected scanner states in the required theme/device matrix. No visual completion claimed.

# UI checklist

Pending implementation and actual review. Keep original camera, keyboard, contrast, feedback, reduced-motion and session-expiry behavior. Preserve all existing release-gate records; automated browser evidence is not physical-device certification.

# Harness changes, if any

None planned. Any added opt-in integration command must retain existing CI gates and dependency checks.
