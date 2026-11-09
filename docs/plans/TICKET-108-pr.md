# Ticket

Ticket: TICKET-108

# Summary

Draft: prepare the scanner to survive an offline reload without extending staff authorization beyond its actual deadline. This branch implements trusted expiry, isolated storage, the authorized shell endpoint and the production standalone build. Worker routing and initial offline authorization checks are implemented; the online preparation/logout bridge and real-browser integration remain unfinished. No offline-ready claim is made.

# Changes

`authenticateStaffSession` retains the existing live role, credential-version, PIN and device-revocation checks and returns the earliest signed-cookie, current event and PIN deadline. Existing identity-only callers retain their exact result contract. `currentStaffDevice` also checks expiry after its device-name read. No session secret, raw cookie or browser-side signing capability is exposed.

The dedicated IndexedDB store atomically invalidates pending saves on logout or newer preparation, makes preparation tokens single-use, validates persisted metadata and checks expiry again after database work. The runtime independently fetches the fixed server endpoint, requires every listed asset with valid status and MIME, reads the cache back before publication, and rechecks the complete grant after fallback asset checks. Session replacement and shortened server deadlines clear the old shell before downloads, even when the current worker cannot use the new build; a stale denial cannot clear newer state. These contracts now drive canonical scanner navigation, save/status/invalidation messages and public asset serving in the service worker. Guest snapshots and unsynced queues are untouched.

The prebuild generator is implemented with deterministic content-addressed JS/CSS/fonts and a final manifest, using existing esbuild/Tailwind dependencies and shared font assets. Three isolated generator tests pass. The real Scanner entry is now built before Next, with explicit tracing of the finalized manifest. The production build passes, all seven public asset hashes match, and both endpoint/worker traces include the final manifest. Actual Vercel packaging and offline browser reload remain unverified.

The new `/checkin/offline-shell` endpoint uses live gate authorization, a domain-separated HMAC session fingerprint and a rechecked absolute deadline. It returns a minimal document without names, raw cookies, server actions or Flight state, with private/no-store headers. The server validates the complete manifest and its build digest; absent generated assets return unavailable. Framework control-flow errors are rethrown.

A session boundary unmounts the camera at expiry, checks delayed interactions and handles worker invalidation. Five lifecycle tests pass. The standalone entry uses the real Scanner component; the offline entry now checks durable session/build identity and the earlier trusted deadline before mounting the camera. The online preparation/logout bridge remains outstanding.

# Acceptance criteria and evidence

Both ticket criteria remain unfinished: offline /checkin reload and a complete precached decoder asset inventory. TICKET-059 is merged and its verified camera code is integrated from develop d0231fad. Guest-data snapshots/outbox remain TICKET-065/066/180.

# Verification

Initial expiry tests failed on the missing API (six failed, one existing-contract test passed). After implementation and independent review, eight expiry tests plus four signed-session tests pass. The additional test crosses the deadline during database reads. Quick verification is run before publishing. Independent follow-up review is clean. The storage suite passes all 28 Chromium/WebKit cases, including a separate worker, expiry during database opening, logout races, single-use preparation, corrupt records and malformed database cleanup. Quick verification passes lint, types and the selected related unit tests. Nineteen endpoint/manifest/generator tests pass, including a real Next control-flow regression and generator-to-server-parser compatibility. Ten runtime unit tests also pass, including quota failure, required-asset eviction, sign-in HTML rejection and concurrent inventory replacement (the latter first reproduced a failure before its fix). Real authenticated offline reload, asset eviction, shipped-worker integration and physical phones remain unverified.

# Risks and rollout

Unfinished draft; no migration, RLS or production changes. The unchanged lockfile from verified develop d0231fad was carried with the user’s standing repository authorization and an exact-path local record, then archived after the integration commit; no additional dependency is introduced by this ticket. All privileged online operations retain live authorization. Offline sessions cannot learn revocations while disconnected, per ADR0020. The planned worker must fetch its own authoritative save response, reject arbitrary private paths, isolate session identity, enforce expiry and fail preparation when any required asset cannot be cached. Reverting the additive expiry API preserves existing session validation.

# Screenshots

The standalone camera entry is implemented. Screenshots and all-theme staff accessibility evidence are still required once the worker is connected.

# UI checklist

Pending: the final standalone scanner/offline states, real camera cleanup and cold-font layout checks remain unverified.

# Remaining work

Implement and independently review worker save/navigation/cleanup and initial durable-authorization reconciliation; wire online preparation/logout; prove actual scanner/decoder precaching and offline reload; finish the UI checklist and required CI. Keep the PR draft until these criteria and dependencies are satisfied.

## Worker checkpoint — 2026-11-09

Quick verification passes lint, types and 82 related tests. Worker tests cover canonical-client boundaries, online 200 revalidation, offline fallback, known denial, durable invalidation failure and readiness-cache removal. The emitted non-null worker source executes in a VM without eagerly touching storage. Six offline-session tests cover initial identity matching, unavailable/replaced grants, invalidation racing a reply and deadline clamping. Independent review identified notification and storage-failure cases; regression fixes retain generation safety and remove only the scanner readiness cache when its grant cannot be invalidated.

This is still a draft. Real worker restart/storage-recovery/browser decoding, production endpoint integration, online preparation/logout, screenshots and final build/CI remain required. If both durable storage channels fail, removal is not acknowledged; no restart-safe guarantee is claimed in that condition.

The follow-up review found a pending-save/failed-logout race. Scanner publication,
invalidation, status/document reads and activation now share an origin-wide Web Lock,
including across worker versions. Missing coordination fails offline use closed while
online navigation remains available. A deferred-publication regression verifies logout
removes readiness after the pending publication finishes. Browser worker restart and
storage-recovery proof still remain; no full offline-ready claim is made.
