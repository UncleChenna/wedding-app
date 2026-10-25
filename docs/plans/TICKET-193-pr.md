# Ticket

Ticket: TICKET-193

# Summary

The PR #21 review (TICKET-105) found a real failure mode in the service worker. It awaited `cache.put` before returning a fetched asset, so the asset load itself failed whenever storing failed:

- with a `206` partial (range) response, for example media, which `cache.put` rejects (and `response.ok` is true for 206, so the worker tried to store it);
- when storage quota is exhausted;
- when Cache Storage is unavailable.

Caching must be best-effort and never break a page. This PR makes it so.

# Changes

- **`src/modules/shared/server/service-worker.ts`**, fetch handler for cache-first assets:
  - The cache lookup is wrapped. If Cache Storage throws, the request falls through to the network.
  - On a miss, the network response is returned to the page immediately.
  - A copy is stored in the background via `event.waitUntil`, only for complete `200`, `basic`, non-redirected responses, so never `206`. Storage errors are swallowed.
  - The caching policy, cache names and lifecycle are unchanged.
- **`src/modules/shared/__tests__/service-worker.test.ts`**: the sandbox can now simulate a `206` response, a rejecting `put` and a throwing `caches.open`. Fetch events get `waitUntil`, and a `settle()` helper waits for background writes. The existing asset test was updated to wait for the background store.
- **`docs/pwa.md`**: documents the best-effort rule.
- **`tickets/TICKET-193-…md`**: the ticket definition, created for this review follow-up and carried in this branch.

# Acceptance criteria and evidence

- [x] **A 206 response is returned to the page and not stored.** Unit test: status 206 reaches the page, and the cache holds no entry.
- [x] **When `cache.put` rejects (quota), the asset response is still returned.** Unit test: status 200, body intact.
- [x] **When Cache Storage itself throws, the request falls through to the network.** Unit test: 200 from one network fetch.

# Verification

- The three new tests failed against the merged worker (confirming the bug); all 22 worker tests pass now.
- `pnpm verify` on base `develop` 5725c80: passed. 193 tickets valid, format, lint, typecheck, 200 unit tests, production build, 40 browser tests, including `e2e/pwa.spec.ts`: registration, cache contents limited to `/_next/static`, offline asset served and `/admin` not.
- **Not verified:** a real quota-exhaustion scenario on a device, which is hard to reproduce; the unit test simulates the rejection.

# Risks and rollout

- **Background writes:** the first load of an asset no longer waits for the cache write. That's slightly faster. If the worker is killed before the write finishes, the asset is simply fetched again next time.
- **Rollback:** revert the PR. Nothing else changes.

# Screenshots

N/A: service-worker behaviour only.

# UI checklist

- [x] **Screenshots:** N/A, no visible change.
- [x] **Tokens:** N/A.
- [x] **Restraint and typography:** N/A.
- [x] **Mobile:** N/A for layout. The pwa smoke tests pass on mobile.
- [x] **Motion:** N/A.
- [x] **Keyboard:** N/A.
- [x] **Contrast:** N/A.
- [x] **Load and images:** Asset loads can no longer fail because of caching.
- [x] **Performance:** First asset load no longer waits for the cache write.
- [x] **Copy:** N/A.
- [x] **Shared components:** N/A.
- [x] **Sharing and devices:** N/A.
- [x] **QR codes:** N/A.
- [x] **Staff feedback:** N/A.
- [x] **Verification:** `pnpm verify` passed.

# Harness changes, if any

- None.
