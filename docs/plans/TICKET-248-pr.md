## Summary

A queued reconnect event can reach a saved offline pass after navigation has departed it. Its unconditional reload reopened invitation A while the browser was navigating to invitation B. The native pass now accepts automatic refresh only while its document is active and the browser reports online; history restoration re-enables the listener. Manual pointer and keyboard refresh remain available offline.

## Changes

The change affects only the native saved-pass lifecycle listener and its regression tests. Cache retention, signing and response identity remain unchanged.

## Acceptance criteria and evidence

- Guard the emitted native script with pagehide/pageshow lifecycle and current connectivity.
- Execute the actual emitted script in focused lifecycle tests.
- Extend the existing real browser journey with stale-event rejection, pointer refresh and history restoration, retaining exact B URL/no-A-content and reconnect revocation assertions.

## Verification

- 18 focused offline-pass, worker and expiry tests pass.
- Independent source review found no blocking issues or weakened checks.
- Captured-document diagnostic reproduction fails without any Refresh action; the guarded version passed 20 plain and 20 keyboard-refresh transitions. This is diagnostic evidence, not full product verification.
- Production build and actual mobile/desktop journeys pass (2/2, 18.4s), including all themes at 375/768/1280, pointer/keyboard refresh, history restoration, exact B isolation and reconnect revocation. Screenshots are in `artifacts/TICKET-248/offline-pass/`; appearance is unchanged.
- Required hosted CI remains pending.

## Risks and rollout

No cache ownership, retention, signing, database schema or UI wording changes. Rollback restores the old listener and would restore the confirmed navigation race. Physical device QA remains a release requirement.

Ticket: tickets/TICKET-248-prevent-stale-reconnect-events-from-reopening-a.md

## Screenshots

The page appearance is unchanged. Existing all-theme captures at 375/768/1280 were regenerated under `artifacts/TICKET-248/offline-pass/`; actual journey accessibility and QR checks pass.

## UI checklist

This is a native lifecycle behavior repair with no visual styling, wording, geometry or QR output changes. Pointer and keyboard refresh, all-theme accessibility, zero layout shift and QR decoding retain their existing passing browser assertions. Physical-device QA and release-wide performance certification remain outstanding release requirements.
