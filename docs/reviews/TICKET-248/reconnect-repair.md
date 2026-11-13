# TICKET-248 reconnect repair

2026-11-13. Base: bd8692728dd61c46ca8587675a3d6592e7d54377. PR: https://github.com/UncleChenna/wedding-app/pull/207.

## Cause

Hosted guest run 43412436934, job 131842112552, recorded a second navigation to saved pass A immediately after navigation to uncached invitation B. A standalone diagnostic using the captured synthetic native document reproduced this even without pressing Refresh. The document's unconditional online listener received a stale connectivity event while it was departing. Removing only that listener eliminated the reproduction. A current-connectivity check alone did not eliminate every transient event.

The repair suppresses automatic refresh after pagehide, restores it on pageshow, and requires current online connectivity. Manual refresh retains its existing native button behavior. It does not change cached identity, expiration, signing, response ownership, or revocation rules.

## Verification

- Baseline lifecycle tests failed against the unconditional listener.
- 18 focused native pass, worker and expiry tests pass after the repair. Lifecycle tests execute the emitted script itself.
- Diagnostic guarded document passed 20 plain and 20 keyboard-refresh transitions. This is diagnostic evidence, not a replacement for the full product test.
- Independent source review found no blocking findings. Exact B URL/no-A-content, cache-empty revocation and existing timeouts remain unchanged.
- Production build passes. Actual mobile and desktop journeys both pass (9.0s and 7.9s; 18.4s total), including stale-event rejection, pointer and keyboard refresh, exact B URL/no-A-content, history restoration, genuine reconnect revocation and empty-cache assertions.
- All-theme screenshots at 375/768/1280 remain under ignored `artifacts/TICKET-248/offline-pass/`; no earlier ticket evidence was rewritten. The native page appearance is unchanged.
- Required hosted CI remains pending.

Physical iOS/Android and WhatsApp checks remain release requirements. No real guest data was used.
