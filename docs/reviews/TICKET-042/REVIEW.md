# TICKET-042 review

2026-11-03. Initial base develop fbe67fccf783fac676024e5ceeb9b8bc95092709.

The personal invitation closes editing at the earlier of the configured cutoff and the venue-local wedding day. Missing/invalid configuration fails closed. Late submissions refresh the route immediately; accepted passes stay visible. History snapshots are written with the mutation transaction and omit contact fields and capability secrets. ADR0020 preserves pass version when party size changes.

Evidence: 12 fake-clock/date tests; 7 isolated database tests for boundaries, history, rollback, concurrency and lock-wait timing; 32 focused tests after stale-state refresh; 15 original/new persistence tests before the final concurrency additions. Production build passes. Dedicated locked browser flow passes9.8s, including stale submission, immediate control removal, native HTML and 12 screenshot combinations. Existing attendance/party browser flows pass4tests20.5s, including old signed-pass validity after party-size changes. Audit-safe fixture retirement preserves immutable history and revokes only audited synthetic invitations.

Lighthouse production mobile:98/99/98 performance,100 accessibility,CLS0 each. These runs precede only the subsequent stale-action refresh change; initial locked-page layout is unchanged. Portable results: performance.json. Synthetic review date2099 is explicitly a test fixture, never a production default.

## UI checklist

- PASS screenshots: four themes ×375/768/1280 in this folder; full-page layouts inspected. Review found misleading open-state wording and corrected it to Your reply before recapture.
- PASS tokens, typography/restraint: existing token classes and layout; no new hard-coded visual tokens.
- PASS browser mobile: no overflow at all review widths; existing controls retain44px targets. No new input/control added.
- PASS reduced motion: every screenshot/test uses reduced motion; no new motion.
- PASS keyboard: pass link focus and visible outline inspected; late reply status retains focus behavior and locked forms are removed.
- PASS contrast: rendered axe checks in all themes; existing contrast-tested tokens unchanged.
- PASS load/performance: three production runs above; no photographs or font changes.
- PASS copy: approved editsLocked string, neutral Your reply navigation for closed state; no technical errors exposed.
- PASS shared components: existing invitation/form/pass components reused; no new reusable visual primitive.
- NOT VERIFIED physical WhatsApp/iOS/Android, native keyboard and real QR scanning; existing TICKET-201 release gate remains mandatory under the standing preview exception. QR encoding and quiet zones unchanged.
- N/A staff feedback: no staff UI change.
- PENDING full verification and final CI; do not mark the ticket done yet.

React review: server-side authorization and time checks remain inside each locked transaction; client components receive only existing display data plus closed copy. Action-state outcomes distinguish locked from retryable errors; no new client fetch or effect-based derived state.
