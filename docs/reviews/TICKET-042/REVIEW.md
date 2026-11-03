# TICKET-042 review

2026-11-03. Initial base develop fbe67fccf783fac676024e5ceeb9b8bc95092709.

The personal invitation closes editing at the earlier of the configured cutoff and the venue-local wedding day. Missing/invalid configuration fails closed. Late submissions refresh the route immediately; accepted passes stay visible. History snapshots are written with the mutation transaction and omit contact fields and capability secrets. ADR0020 preserves pass version when party size changes.

Evidence: 12 fake-clock/date tests; 7 isolated database tests for boundaries, history, rollback, concurrency and lock-wait timing; 32 focused tests after stale-state refresh; 15 original/new persistence tests before the final concurrency additions. Production build passes. Dedicated locked browser flow passes (9.8s), including stale submission, immediate control removal, native HTML and 12 screenshot combinations. Existing attendance/party browser flows: 4 passed (20.5s), including old signed-pass validity after party-size changes. Audit-safe fixture retirement preserves immutable history and revokes only audited synthetic invitations.

Lighthouse production mobile: 98/99/98 performance, 100 accessibility, CLS 0 each. These runs precede only the subsequent stale-action refresh change; initial locked-page layout is unchanged. Portable results: performance.json. Synthetic review date 2099 is explicitly a test fixture, never a production default.

## UI checklist

- PASS screenshots: four themes × 375/768/1280 in this folder; full-page layouts inspected. Review found misleading open-state wording and corrected it to Your reply before recapture.
- PASS tokens, typography/restraint: existing token classes and layout; no new hard-coded visual tokens.
- PASS browser mobile: no overflow at all review widths; existing controls retain 44px targets. No new input/control added.
- PASS reduced motion: every screenshot/test uses reduced motion; no new motion.
- PASS keyboard: pass link focus and visible outline inspected; late reply status retains focus behavior and locked forms are removed.
- PASS contrast: rendered axe checks in all themes; existing contrast-tested tokens unchanged.
- PASS load/performance: three production runs above; no photographs or font changes.
- PASS copy: approved editsLocked string, neutral Your reply navigation for closed state; no technical errors exposed.
- PASS shared components: existing invitation/form/pass components reused; no new reusable visual primitive.
- NOT VERIFIED physical WhatsApp/iOS/Android, native keyboard and real QR scanning; existing TICKET-201 release gate remains mandatory under the standing preview exception. QR encoding and quiet zones unchanged.
- N/A staff feedback: no staff UI change.
- PASS full pnpm verify against develop f5e5db58446363c6a0b4998dea3dbdfa603a43c1, implementation/integration head 1c91a7f: 834 unit tests (54 skipped), 769 browser tests (165 skipped; 9.6 minutes), ticket validation, formatting, lint, types and production build. Final CI remains pending; do not mark the ticket done before merge.

React review: server-side authorization and time checks remain inside each locked transaction; client components receive only existing display data plus closed copy. Action-state outcomes distinguish locked from retryable errors; no new client fetch or effect-based derived state.

2026-11-03 follow-up: the first t:pr verification rerun had four desktop accessibility timeouts (765 passed, 165 skipped), despite the preceding complete green run. All four unchanged cases passed with one worker in 6.4 seconds. Original traces are preserved under artifacts/TICKET-042/pr-workflow-failures. This suggests transient contention but does not certify the full gate. No assertion, timeout, retry setting or hook was changed. The subsequent complete t:pr result is recorded below.

Final local gate: the unchanged complete t:pr rerun passed on ab93009: 834 unit tests (54 skipped), production build and 769 browser tests (165 skipped; 7.7 minutes). All four prior timeout cases passed within this full run. The CLI published the ticket as in_review in PR #81. Final GitHub checks and human review remain required; no merge is authorized.
