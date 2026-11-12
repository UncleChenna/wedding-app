# TICKET-066 handoff

2026-11-12 — divine/codex — owned branch TICKET-066.

Mandatory live board/next/show confirmed this is the next unowned ready ticket after065's verified PR158 merge and CLI completion. Managed worktree starts from develop2a0cf958; no database started. Plan/contract is in docs/plans/TICKET-066-pr.md. No implementation or verification claimed yet.

Coordinate with063 manual search and068 cross-scanner updates: keep existing snapshot read/refresh and unsafe-cache fences. Proposed v2 snapshot actor IDs retain v1 read-only compatibility; never fabricate a QR for manual admission. Use a separate queue store and the existing origin WebLock. Do not delete pending events on logout/expiry. Original-actor checks and post-lock live authentication must reach the sync server, not just the browser.

Next: publish draft PR, implement regression-first pure queue/storage contracts, then worker/HTTP integration, UI and isolated verification. No concurrent editor in this worktree. Root oversees independent review and serial merges.

Unwired foundation added: strictminimal queue policy, durable IndexedDB journal, committed-ackbarriers, originalactorbinding and globalbrowser pending allowance.12unit/10actualIDBChromiumWebKit pass; quick andcriticalcoveragepass.024review caught ambiguousnullable allowance and crossoperatorbarrierrecovery; fixed with explicit known/name-checked-unknown contract and capturedgeneration clearing,2red regressions→green. Positiveattempt alwaysrequiresinvitationID. No queue/private-store wiring, upload, actor snapshotv2 or UI yet. Next checkpoint/push, snapshotactorcontract andserver-boundary regression.
