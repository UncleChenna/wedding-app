# Ticket

Ticket: TICKET-108

# Summary

Draft: prepare the scanner to survive an offline reload without extending staff authorization beyond its actual deadline. This branch currently implements the trusted expiry foundation and isolated browser storage and required-asset preparation contracts; no offline-ready claim is made.

# Changes

`authenticateStaffSession` retains the existing live role, credential-version, PIN and device-revocation checks and returns the earliest signed-cookie, current event and PIN deadline. Existing identity-only callers retain their exact result contract. `currentStaffDevice` also checks expiry after its device-name read. No session secret, raw cookie or browser-side signing capability is exposed.

The dedicated IndexedDB store atomically invalidates pending saves on logout or newer preparation, makes preparation tokens single-use, validates persisted metadata and checks expiry again after database work. The runtime independently fetches the fixed server endpoint, requires every listed asset with valid status and MIME, reads the cache back before publication, and rechecks the complete grant after fallback asset checks. Session replacement and shortened server deadlines clear the old shell before downloads, even when the current worker cannot use the new build; a stale denial cannot clear newer state. These contracts are not yet connected to the service worker. Guest snapshots and unsynced queues are untouched.

The prebuild generator is implemented with deterministic content-addressed JS/CSS/fonts and a final manifest, using existing esbuild/Tailwind dependencies and shared font assets. Three isolated generator tests pass. It is not yet wired into the production build or scanner entry; deployment packaging still needs checksum verification.

The new `/checkin/offline-shell` endpoint uses live gate authorization, a domain-separated HMAC session fingerprint and a rechecked absolute deadline. It returns a minimal document without names, raw cookies, server actions or Flight state, with private/no-store headers. The server validates the complete manifest and its build digest; absent generated assets return unavailable. Framework control-flow errors are rethrown.

# Acceptance criteria and evidence

Both ticket criteria remain unfinished: offline /checkin reload and a complete precached decoder asset inventory. TICKET-059 remains a dependency. Its camera code has not been copied into this branch before merge. Guest-data snapshots/outbox remain TICKET-065/066/180.

# Verification

Initial expiry tests failed on the missing API (six failed, one existing-contract test passed). After implementation and independent review, eight expiry tests plus four signed-session tests pass. The additional test crosses the deadline during database reads. Quick verification is run before publishing. Independent follow-up review is clean. The storage suite passes all 28 Chromium/WebKit cases, including a separate worker, expiry during database opening, logout races, single-use preparation, corrupt records and malformed database cleanup. Final quick verification passes lint and types; its related-unit selector finds no affected tests for these browser-only files. Nineteen endpoint/manifest/generator tests pass, including a real Next control-flow regression and generator-to-server-parser compatibility. Ten runtime unit tests also pass, including quota failure, required-asset eviction, sign-in HTML rejection and concurrent inventory replacement (the latter first reproduced a failure before its fix). Real authenticated offline reload, asset eviction, shipped-worker integration and physical phones remain unverified.

# Risks and rollout

Unfinished draft; no migration, dependency, RLS or production changes. All privileged online operations retain live authorization. Offline sessions cannot learn revocations while disconnected, per ADR0020. The planned worker must fetch its own authoritative save response, reject arbitrary private paths, isolate session identity, enforce expiry and fail preparation when any required asset cannot be cached. Reverting the additive expiry API preserves existing session validation.

# Screenshots

No UI change yet. Screenshots and all-theme staff accessibility evidence are required when the shell is connected.

# UI checklist

Not yet applicable to this foundation without a rendered UI; the final scanner/offline states remain unverified.

# Remaining work

Implement and independently review worker save/navigation/cleanup boundaries; integrate merged059; precache all scanner and decoder assets; add expiry-aware UI; run real authenticated offline browser and required CI checks. Keep the PR draft until these criteria and dependencies are satisfied.
