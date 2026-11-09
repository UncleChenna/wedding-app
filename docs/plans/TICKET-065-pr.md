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

Pending regression-first unit tests, independent storage/privacy review, real IndexedDB/browser offline tests and final CI. No production data operation planned.

# Risks and rollout

Names, party sizes and table assignments are private device data. A valid session is required for access. Storage failures must fail closed, and persisted authorization must not resurrect after logout. Existing scanner/admission files remain owned by TICKET-061 until its merge; the first implementation slice adds new modules only.

# Screenshots

Pending actual scanner freshness and offline read-only UI evidence.

# UI checklist

Pending implementation and review. Physical-device release requirements remain explicit.

# Harness changes, if any

No workflow or hook changes planned.
