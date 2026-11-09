# Ticket

Ticket: TICKET-108

# Summary

A signed-in gate device can prepare the scanner camera, close the browser and reopen it without a network connection until its trusted session deadline. Offline preparation uses a minimal server-authorized document and complete immutable asset inventory. Signing out clears saved access and locks other scanner tabs.

This PR remains draft while integrating the newly merged TICKET-060 result component and completing final verification. Offline guest snapshots/admission queues belong to TICKET-065/066/180; this change does not claim offline admission decisions.

# Changes

- Return the earliest signed-cookie, event and PIN expiry from live staff authorization, with checks after database reads. Share an opaque, domain-separated session fingerprint between the online scanner and offline grant.
- Generate the real scanner/decoder JS, shared CSS and local fonts before Next builds; trace the final manifest. The server emits a private/no-store minimal document without staff names, raw cookies, server actions or Flight data.
- Store authorization in isolated IndexedDB transactions, with single-use preparation generations. Publish readiness only after every asset is downloaded, validated and read back.
- Wire canonical scanner navigation, public assets, preparation/status/invalidation messages and activation. Origin-wide Web Locks serialize publication and logout across workers. Network work is bounded; a failed authorization deletion also removes scanner readiness caches across builds, preserving guest passes and outboxes.
- Match durable session/build/deadline before the offline camera mounts. Expiry, logout and known replacement stop camera tracks; a matching newly authenticated tab remains usable even if offline asset preparation fails.
- Add online preparation/retry controls and two-phase enhanced sign-out: clear saved access, clear the server cookie, then clear saved access again. Native navigation POSTs are serialized and invalidated after the cookie-changing response. The proxy returns an explicit401 for denied offline-shell requests instead of sign-in HTML.
- Extend two existing CI jobs with the authenticated offline journey and Chromium/WebKit worker tests. Existing checks and timeouts remain unchanged; see [CI coverage](../reviews/TICKET-108/ci-proposal.md).

# Acceptance criteria and evidence

The requested offline reload and complete decoder inventory have passing evidence on the pre-TICKET-060 integration checkpoint. Keep the ticket incomplete until the integrated scanner is verified and final CI passes.

- Real emitted worker plus generated camera bundle: offline reload and actual QR video-pixel decoding in Chromium and WebKit.
- Session deadline: camera tracks end at expiry; a later reload receives the generic offline page.
- Full browser shutdown/relaunch offline: both engines restore the scanner from persistent storage.
- Injected IndexedDB invalidation failure: scanner caches are removed; after browser restart and storage recovery, old access remains unavailable.
- Actual Next production route with isolated native PostgreSQL: PIN sign-in, preparation, offline reload, enhanced sign-out and denied later offline access pass on mobile and desktop.

# Verification

- Combined storage/worker suite:46 passes in36.4seconds.
- Authenticated production journey:2 passes in4.1seconds after the explicit proxy denial fix. The initial run exposed the redirect bug; assertions were preserved.
- Quick verification: lint/types/115 related tests pass. Final integrated verification remains pending.
- Production builds pass. Final manifest and asset integrity were checked earlier; final integrated deployment/build verification remains required.
- Independent source review found and verified fixes for stale generations, failed invalidation, pending publication, missed notifications and session replacement. All24 camera-off screenshots were inspected without visual blockers; files are under `docs/reviews/TICKET-108/{chromium,webkit}/`.

# UI evidence

Four themes at375/768/1280 pass overflow and44px-target checks; each theme passes axe in both browser engines. Browser tests verify real expiry cleanup. The native offline document uses the same local font files/metrics as the shared theme; online pages retain Next font loading. Physical phones, WhatsApp, actual camera conditions and fresh performance/CLS measurements remain unverified release requirements, not passes.

# Risks and rollout

Keep PR142 draft pending TICKET-060 integration and final review/CI. TICKET-201/114/138 retain applicable physical-device and performance release gates. Native PostgreSQL evidence does not certify Supabase Auth/Realtime. No database schema, production database application or new dependency is included.

Missing/evicted assets, unavailable coordination or invalid grants fail offline use closed. If both durable storage channels fail, removal is not acknowledged and no restart-safe guarantee is claimed. Offline operation cannot instantly learn remote revocation; the trusted expiry and next online authorization remain the boundary.

Builds must run the prebuild generator and include its traced manifest/public assets. Rollback should use the prior complete deployment; never mix worker and scanner asset inventories across deployments.
