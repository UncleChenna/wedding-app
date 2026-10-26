# Ticket

Ticket: TICKET-106

# Summary

Venue signal is unknown (PRD connectivity plan). Until now, a guest who lost signal and tapped a link they hadn't opened before got the browser's raw "No internet" error. Now they get a warm, themed "You're offline" page with a "Try again" button. The page is generic and public, so it carries no guest data and is the only page the worker ever stores. Visited pages are still never cached.

# Changes

- **Page:**
  - `src/app/(guest)/offline/page.tsx` (new, static ○): title "You're offline", `noindex`.
  - `src/modules/shared/components/offline-notice.tsx` (new, server): eyebrow, heading, divider and one sentence. "Try again" sits at the bottom on phones, with safe-area padding.
  - `src/modules/shared/components/retry-button.tsx` (new, the smallest client boundary): the shared `Button`, reloading the page.
- `src/modules/shared/lib/sw-policy.ts`:
  - New policy `network-offline-fallback` for GET, same-origin requests with `mode: "navigate"`, including any query string.
  - `PolicyRequest.mode` added.
  - `SW_OFFLINE_CACHE` (`wedding-offline-v1`) and `SW_OFFLINE_URL` added.
- `src/modules/shared/server/service-worker.ts`:
  - **Install** fetches `/offline` with `cache: "reload"` and stores it; this is required, so install fails and retries on the next visit if it can't. It then precaches the `/_next/static/**` assets the page references, plus fonts referenced from its CSS (relative URLs resolved), best-effort.
  - **Fetch:** a navigation calls `fetch(request)`. Only on failure does it answer with the cached offline page, falling back to `Response.error()` if Cache Storage is unavailable.
  - **Activate** keeps both current caches and deletes obsolete `wedding-` ones.
- `e2e/pwa.spec.ts`:
  - New offline-navigation test.
  - The cache-inspection test now allows exactly one non-asset entry, `/offline`, and still requires every other entry to be `/_next/static/**`.
- `e2e/support/routes.ts`: adds `/offline`, so it is axe-scanned in every theme and overflow-checked.
- `docs/pwa.md`: install and fallback behaviour, plus strategy-table rows.
- Tickets filed (definitions only):
  - TICKET-195: e2e `applyTheme` doesn't wait for colour transitions, so screenshots can show the previous theme's button colour.
  - TICKET-194: `t:new` burns a ledger id when its input is invalid. That happened here, and 194 documents it, which keeps ids contiguous.

# Acceptance criteria and evidence

- [x] **Offline navigation to an uncached route shows the offline page (e2e).** `pwa.spec.ts` › "offline, navigating to a page never visited shows the styled offline page":
  - It goes offline and navigates to `/i/never-opened-token`.
  - It asserts the h1 "You're offline", the "Try again" button, a loaded stylesheet, h1 ≥ 32px and a themed background.
  - Back online, "Try again" leaves the offline page.
  - Passes on mobile and desktop.
  - Mutation check: with the navigate branch removed, it fails with `net::ERR_INTERNET_DISCONNECTED`.

# Verification

- `pnpm vitest run src/modules/shared/__tests__/service-worker.test.ts`: 32 passed. New tests cover:
  - navigation policy cases;
  - fetch, POST and cross-origin exclusions;
  - precache of the page, JS, CSS and fonts, with a query-string asset skipped;
  - a failing asset not failing the install;
  - online → network, offline → offline page with nothing else stored;
  - an offline `fetch` not being intercepted;
  - activate keeping both caches.
- `pnpm exec playwright test e2e/pwa.spec.ts e2e/overflow.spec.ts`: 17 passed.
- `pnpm verify` on develop e84a8ca merged in: format, lint, types, 228 unit tests, build and 93 browser smoke tests passed. This includes the new axe scans of `/offline` in both themes.

# Risks and rollout

- Every navigation now goes through the worker's `respondWith(fetch(request))`. Responses are passed through untouched, including redirects. Overhead is negligible, but this is the first time the worker handles pages; nothing is stored.
- Install now depends on `/offline` being fetchable. If it fails, the worker isn't installed on that visit and retries on the next one. Previously install could not fail.
- `SW_CACHE_VERSION` is unchanged: v1 clients gain the offline cache on update, and activate keeps both.
- Not done: the link to a saved pass needs TICKET-107. The pass doesn't exist yet, and `docs/pwa.md` records the hand-off.
- Untested: real iOS/Android devices and WhatsApp's in-app browser, which may not use the service worker at all.
- Rollback: revert the PR. The next worker's activate step deletes the offline cache only if the cache version is bumped; otherwise it is harmless leftover public content.

# Screenshots

Local (`artifacts/screenshots/<theme>/<width>/offline.png`), at 375/768/1280 in ivory-gold and midnight-champagne. On phones the button sits at the bottom within thumb reach; on desktop it is centred under the copy.

In the midnight screenshots "Try again" looks ivory-gold's brown. That is a harness artifact: it was captured mid-transition after the theme swap. The computed colour is champagne `rgb(217, 185, 122)` 400ms later. Tracked in TICKET-195.

# UI checklist

- [x] **Screenshots:** `/offline` at 375/768/1280 in both themes, inspected. See the note above about the harness transition artifact.
- [x] **Tokens:** Only token classes are used (`text-primary`, `text-muted-foreground`, shared `Button`/`Divider`). There are no literals.
- [x] **Restraint and typography:** one idea and one primary action; display serif heading at 36/48px; 0.15em label tracking; 16px body with relaxed leading in `max-w-md`.
- [x] **Mobile:** the overflow test passes at 375px. The button is full width and `min-h-13`, sits at the bottom on phones, and has `env(safe-area-inset-bottom)` padding.
- [x] **Motion:** N/A, no animation added (the button's existing colour transition is 150ms).
- [x] **Keyboard:** one native button with a visible focus ring.
- [x] **Contrast:** the axe scan of `/offline` passes in both themes (a11y-routes).
- [x] **Load and images:** no images. The page is static and precached with its assets.
- [ ] **Performance:** Not verified: Lighthouse via npx is not permitted in this environment. The page is static with one small client component.
- [x] **Copy:** "You're offline" / "The signal dropped for a moment. Your invitation will be right here as soon as you're connected again." / "Try again". This wording is provisional; the PRD has no approved offline copy.
- [x] **Shared components:** reuses `Button` and `Divider`. No new reusable pattern.
- [ ] **Sharing and devices:** Not verified on real devices or WhatsApp in-app browsers. `noindex`; inherits the default Open Graph metadata.
- [x] **QR codes:** N/A.
- [x] **Staff feedback:** N/A, guest page.
- [x] **Verification:** `pnpm verify` passed.

# Harness changes, if any

- None. TICKET-194 is filed for the `t:new` id allocation bug.
