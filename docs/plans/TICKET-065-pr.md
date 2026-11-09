# Ticket

Ticket: TICKET-065

# Summary

Draft: cache a minimal authenticated guest snapshot for scanners, with honest freshness and session expiry. Work starts ahead of TICKET-061; this PR remains a draft until that dependency is merged and the combined implementation is verified.

# Changes

Planned foundation: strict minimal snapshot projection, bounded server response, worker-owned IndexedDB storage and read-only offline resolution. Reuse TICKET-108's opaque session fingerprint and origin-wide publication lock. Clear private snapshots on sign-out, session replacement and expiry without touching unsynced admission queues.

Policy is exactly TICKET-169: refresh every five minutes and after known admissions/revocations/reissues; warn after thirty minutes but do not invent a hard age cutoff while the session remains valid. An offline scanner cannot learn subsequent revocations until refresh.

# Acceptance criteria and evidence

Pending tests for valid/used/revoked/replaced results, minimal fields, missing/corrupt storage, publication/logout races, stale snapshots, party edits and session expiry. No admission queue or offline physical admission receipt is implemented here; TICKET-066 owns those writes.

# Verification

Foundation checks: strict snapshot parser 10 tests pass; bounded refresh runtime 9 tests pass; authenticated response boundary 4 tests pass. Quick lint/types and related tests pass (the conditional database test is separately exercised below). Real IndexedDB tests pass 6/6 across Chromium and WebKit, including logout fencing, expiry, and an already-expired authoritative refresh replacing an older longer deadline. Independent review identified that last edge case; generation-scoped deadline authorization now prevents the stale copy surviving it.

An isolated PostgreSQL16 database at this worktree's reserved port26721 started with zero public tables, received the existing migrations, and passed the explicit-column projection test. Synthetic fixtures include contact/dietary secrets and a revoked household with a real historical admission; only permitted fields are returned and the admission count remains available. The test rolls back all fixtures; the database process is stopped with its data directory retained. No production data operation occurred.

The worker lock/latch bridge now has 21 passing unit regressions; sign-out compatibility has three. Review reproduced two early-rejection races where a parallel erasure could outlive the publication lock. Both now await all settlements before releasing it and still reject any failed erasure. Older worker acknowledgements trigger locked two-store cleanup; only the new explicit private-erasure acknowledgement is trusted.

The actual emitted worker and real IndexedDB suite passes 16/16 in Chromium and WebKit (12.9s), including offline reads, cross-tab delayed refresh versus logout, session replacement, expiry-triggered physical erasure, and full browser restart offline after injected private-erasure failure. This fixture uses synthetic HTTP grants, not production authentication. The pure offline adapter passes seven actual-signature tests for valid/used/revoked/replaced/unknown and expired/replaced sessions without mutating admission state.

Still pending: authenticated product route browser proof, offline scanner UI integration, broader final coverage and CI. These foundation results do not certify the full offline feature.

# Risks and rollout

Names, party sizes and table assignments are private device data. A valid session is required for access. Storage failures must fail closed, and persisted authorization must not resurrect after logout. Existing scanner/admission files remain owned by TICKET-061 until its merge; the first implementation slice adds new modules only.

# Screenshots

Pending actual scanner freshness and offline read-only UI evidence.

# UI checklist

Pending implementation and review. Physical-device release requirements remain explicit.

# Harness changes, if any

No workflow or hook changes planned.
