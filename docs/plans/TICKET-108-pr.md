# Ticket

Ticket: TICKET-108

# Summary

A signed-in gate device can prepare the scanner camera, close the browser and reopen it without a network connection until its trusted session deadline. Offline preparation uses a minimal server-authorized document and complete immutable asset inventory. Signing out clears saved access and locks other scanner tabs.

TICKET-060 is integrated from verified develop `2df977c6`. Local integrated verification and independent source/visual review pass; final PR-head CI remains the merge gate. Offline guest snapshots/admission queues belong to TICKET-065/066/180; this change does not claim offline admission decisions.

# Changes

- Return the earliest signed-cookie, event and PIN expiry from live staff authorization, with checks after database reads. Share an opaque, domain-separated session fingerprint between the online scanner and offline grant.
- Generate the real scanner/decoder JS, shared CSS and local fonts before Next builds; trace the final manifest. The server emits a private/no-store minimal document without staff names, raw cookies, server actions or Flight data.
- Store authorization in isolated IndexedDB transactions, with single-use preparation generations. Publish readiness only after every asset is downloaded, validated and read back.
- Wire canonical scanner navigation, public assets, preparation/status/invalidation messages and activation. Origin-wide Web Locks serialize publication and logout across workers. Network work is bounded; a failed authorization deletion also removes scanner readiness caches across builds, preserving guest passes and outboxes.
- Match durable session/build/deadline before the offline camera mounts. Expiry, logout and known replacement stop camera tracks; a matching newly authenticated tab remains usable even if offline asset preparation fails.
- Add online preparation/retry controls and two-phase enhanced sign-out: clear saved access, clear the server cookie, then clear saved access again. Native navigation POSTs are serialized and invalidated after the cookie-changing response. The proxy returns an explicit401 for denied offline-shell requests instead of sign-in HTML.
- Extend two existing CI jobs with the authenticated offline journey and Chromium/WebKit worker tests. Existing checks and timeouts remain unchanged; see [CI coverage](../reviews/TICKET-108/ci-proposal.md).

# Acceptance criteria and evidence

Both requested implementation criteria have passing integrated evidence. The ticket remains in review until the final PR-head CI passes and the PR is merged.

- Real emitted worker plus generated camera bundle: offline reload and actual QR video-pixel decoding in Chromium and WebKit.
- Session deadline: camera tracks end at expiry; a later reload receives the generic offline page.
- Full browser shutdown/relaunch offline: both engines restore the scanner from persistent storage.
- Injected IndexedDB invalidation failure: scanner caches are removed; after browser restart and storage recovery, old access remains unavailable.
- Actual Next production route with isolated native PostgreSQL: PIN sign-in, preparation, offline reload, enhanced sign-out and denied later offline access pass on mobile and desktop.

# Verification

- Combined storage/worker suite:46 passes in 42.4 seconds after TICKET-060 integration.
- Authenticated production journey:2 passes after integration, including all-theme axe, measured initial CLS 0, keyboard refresh and keyboard sign-out. The initial run exposed the redirect bug; assertions were preserved.
- Quick verification: lint/types/related tests pass. Full integrated unit run: 1,733 pass, 185 conditional skips, 69.09 seconds; critical coverage 98.27% lines / 98.46% branches.
- Integrated production build passes. No live deployment is claimed.
- Independent source review found and verified fixes for stale generations, failed invalidation, pending publication, missed notifications and session replacement. All 24 integrated offline camera-off screenshots and 8 production control screenshots were inspected without visual blockers; files are under `docs/reviews/TICKET-108/`.

# UI evidence

Four themes at 375/768/1280 pass overflow and 44px-target checks; each theme passes axe in both browser engines. Browser tests verify real expiry cleanup. The native offline document uses the same local font files/metrics as the shared theme; online pages retain Next font loading. Production initial CLS is 0 on mobile and desktop. Physical installed phones and actual camera conditions remain unverified release requirements, not passes. The staff-only route has no guest Lighthouse threshold; no fresh Lighthouse score is claimed. The full itemized checklist is [UI review](../reviews/TICKET-108/ui-review.md).

# Risks and rollout

Merge PR142 only after all final-head CI checks pass. TICKET-201/114/138 retain applicable physical-device and performance release gates. Native PostgreSQL evidence does not certify Supabase Auth/Realtime. No database schema, production database application or new dependency is included.

Missing/evicted assets, unavailable coordination or invalid grants fail offline use closed. If both durable storage channels fail, removal is not acknowledged and no restart-safe guarantee is claimed. Offline operation cannot instantly learn remote revocation; the trusted expiry and next online authorization remain the boundary.

Builds must run the prebuild generator and include its traced manifest/public assets. Rollback should use the prior complete deployment; never mix worker and scanner asset inventories across deployments.
