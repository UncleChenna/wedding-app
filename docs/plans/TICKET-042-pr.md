# Ticket

Ticket: TICKET-042

# Summary

Guests can no longer change attendance or companions after the RSVP cutoff or venue-local wedding-day midnight. Late submissions close stale controls immediately. Accepted guests keep their entry pass. Successful changes now record before/after history atomically.

# Changes

- Fail closed for missing/invalid time-zone/date configuration; never substitute the developer time zone.
- Check time after acquiring the invitation row lock in both mutation paths.
- Store attendance and guest snapshots in existing append-only rsvp_changes, excluding contact fields and capability secrets.
- Preserve token_version for party-size changes, following ADR0020.
- Show approved locked wording and Your reply navigation; remove forms while retaining accepted passes.
- Retire audited synthetic browser fixtures by revoking them, preserving audit records. All existing assertions remain.

# Acceptance criteria and evidence

Boundary fake-clock tests cover one millisecond before/at/after midnight, DST dates and invalid settings. Seven isolated DB tests cover both mutation paths, history contents/timestamps, concurrency, a lock wait across cutoff, rollback and unchanged pass version. A production browser test confirms a stale submission is rejected without changing attendance, controls disappear immediately, and the signed pass remains with JavaScript disabled. Existing attendance and companion flows also pass.

# Verification

Initial base develop fbe67fccf783fac676024e5ceeb9b8bc95092709. Twelve cutoff tests and 32 focused tests pass; production build passes. Dedicated locked browser passes (9.8s); existing RSVP/party flows: 4 passed (20.5s). Lighthouse 98/99/98, accessibility 100, CLS 0; initial locked layout unchanged by the final stale-action refresh fix. Detailed evidence: docs/reviews/TICKET-042/REVIEW.md.

Integrated develop f5e5db58446363c6a0b4998dea3dbdfa603a43c1 without conflicts. Full pnpm verify passed on 1c91a7f: ticket validation, formatting, lint, types, 834 unit tests (54 skipped), production build, and 769 browser tests (165 skipped; 9.6 minutes). Opt-in database/browser suites were run separately as described above. Final PR-workflow verification and CI remain required before review readiness.

# Risks and rollout

No migration, dependency, RLS or infrastructure change. The existing venue time zone remains TBD; production replies stay closed until configured. History includes RSVP/party details and remains subject to the existing admin-access/retention requirements. Existing immutable history is never deleted by tests. Reverting this code stops future history writes and removes enforcement; preserve already-written records. Physical-device QA remains mandatory in release-blocking TICKET-201 under the approved preview exception.

# Screenshots

Twelve full-page captures: docs/reviews/TICKET-042/<theme>/<375|768|1280>-locked.png. All four themes inspected. Dates/names are synthetic review fixtures.

# UI checklist

PASS browser screenshots, tokens, restraint, mobile overflow, reduced motion, keyboard, contrast, copy, shared components and initial-load metrics. No photographs, new font or staff UI. Physical-device/WhatsApp/native QR checks are not verified and remain release gates. Full local verification passed; no launch certification.

# Harness changes, if any

Only test-fixture cleanup adapts to mandatory append-only history; no hooks, assertions or checks are weakened.

2026-11-03 follow-up: the first t:pr verification rerun had four desktop accessibility timeouts (765 passed, 165 skipped), despite the preceding complete green run. All four unchanged cases passed with one worker in 6.4 seconds. Original traces are preserved under artifacts/TICKET-042/pr-workflow-failures. This suggests transient contention but does not certify the full gate. No assertion, timeout, retry setting or hook was changed. A new complete t:pr run is required before review status.
