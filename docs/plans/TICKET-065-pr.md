# Ticket

Ticket: TICKET-065

# Summary

Scanners now save a minimal, session-bound guest list after PIN sign-in and can check signed passes after an offline reload. Cached checks show valid, used, revoked and replaced results without recording admission. Live admission and uncertain retries remain unchanged; offline admission queueing belongs to TICKET-066.

# Changes

- An authenticated, no-store endpoint projects only names, invitation/version/status, RSVP allowance, admitted count, table and public verification keys. It rechecks the same live session after a consistent database read and bounds the response to 2 MiB.
- A separate worker-owned IndexedDB store shares the existing origin-wide publication lock with scanner authorization. Generations fence late writes; sign-out, replacement and expiry erase private data without touching admission queues.
- Refresh occurs at sign-in, every five minutes, on resume/reconnect and after known changes. A known authoritative change clears the matching private copy before refresh, so failed refresh cannot knowingly resurrect an older valid result. Failed erasure locks offline access and removes scanner readiness, including after browser restart.
- The UI shows snapshot age, a thirty-minute warning, refresh status and explicit read-only wording. Thirty minutes is a warning, not an invented hard expiry. The earliest trusted session/PIN/event deadline remains authoritative.
- Older worker acknowledgements trigger locked fallback cleanup. All parallel erasures settle before releasing the lock. A shorter newly authorized deadline invalidates the old embedded scanner identity.

# Acceptance criteria and evidence

All functional criteria are demonstrated by the authenticated browser suite and real worker tests. The actual production flow signs in, verifies private-field exclusion, saves a snapshot, reloads offline, decodes a signed QR from camera pixels, and checks fresh valid, stale valid, used, replaced and revoked states. Offline checks create no scan events; one explicit synthetic online admission demonstrates the used count. Keyboard sign-out physically clears IndexedDB.

The policy follows TICKET-169: five-minute refresh, immediate refresh after known changes, thirty-minute warning and session expiry. Disconnected changes on another scanner remain unknown until refresh. No email, phone, notes, credentials or signed bearer token is cached. Names are private local device data, not a public asset.

# Verification

- Production build passed.
- Authenticated snapshot journey: **2/2 passed**, mobile and desktop, 42.2 seconds. All six states were checked in four themes at 375/768/1280; axe reported zero violations, controls met 44px and pages had no horizontal overflow.
- Existing online admission integration: **2/2 passed**, 31.3 seconds, preserving actual partial admission, immutable uncertain retry, duplicate receipt and concurrent refusal assertions.
- Existing authenticated offline shell integration: **2/2 passed**, 37.4 seconds, including exact zero initial CLS, keyboard refresh/sign-out and offline denial after logout.
- Exact generated-worker/real IndexedDB suite: **24/24 passed**, Chromium and WebKit, 15.0 seconds. Includes old-worker acknowledgement fallback, concurrent refresh/logout, shortened deadlines, missing authority cleanup, failed private erasure and full browser restart offline.
- Actual isolated PostgreSQL projection: **1/1 passed**. Private fields excluded; large named households retain all names with a bounded display label; revoked households preserve historical admitted counts. The transaction rolls back its fixtures.
- Focused admission/worker/wrapper tests: **38 passed**, including uncertain intent preservation when switching to read-only mode. Hook tests include the reproduced initial preparation-notification race. Pure parser/response/resolver targeted coverage reached 100% for the three new pure modules.
- Full combined unit/coverage gate: **1,873 passed / 194 conditional skips**, 108.25 seconds; critical lines98.59%, branches98.89%, every per-file threshold passed. Final combined quick passed lint, types and28 related tests; the earlier broader quick passed114. Exact-head CI remains pending.

The existing shell/decoder fixture also passes **46/46** Chromium/WebKit cases (43.1 seconds). The first checkpoint CI exposed its obsolete assertion that offline QR checks make a live POST. The fixture now uses an actual signed QR and private snapshot and proves exact household/table/party, no admission form and zero POST, retaining all expiry/track/restart assertions.

Initial production evidence failed because a shell-ready notification arrived during an unavailable initial refresh and was coalesced away. A deferred regression reproduced it; one bounded follow-up refresh fixes the race. Review also reproduced early-rejection erasure races and a failed known-change erase path. The final tests retain those failure cases without relaxing deadlines or assertions.

# Screenshots

144 inspected screenshots: `docs/reviews/TICKET-065/{mobile,desktop}/{saved,cached-valid,stale,cached-used,cached-replaced,cached-revoked}-<theme>-<width>.png`. All twelve review contact sheets were inspected along with the full mobile valid view. No clipping, overlap or unreadable status contrast was found. Integration screenshots from existing tickets go to ignored `artifacts/TICKET-065/` via the optional `SCANNER_REVIEW_DIR`; their original evidence is preserved.

# UI checklist

PASS: staff screenshot/axe requirements, token-only styling, 18px staff body/control text, clear status icons/copy, all-theme contrast, 44px targets, overflow checks, reduced motion, keyboard sign-out and existing keyboard refresh, zero initial CLS, shared Button/result components. Existing camera feedback remains unchanged and online admission integration passes. No new photographic asset, QR output or reusable general component was added; those checklist items are N/A. Guest-page Lighthouse/WhatsApp requirements are N/A to this staff-only change. Physical camera/device/offline release certification remains unverified in TICKET-114/TICKET-163/TICKET-201; no automated result is represented as physical-device QA. Full CI verification remains pending. The updated stale notice is also rendered inside the pass result as ADR0020 requires.

# Risks and rollout

No schema migration, dependency, public signing material change or production data action. Private storage may be denied or evicted; that fails closed and online scanning remains available when its session is valid. Offline reads cannot learn remote revocations until refresh and never constitute a recorded admission. The persistent readiness purge protects restart after a private erase failure; if both independent storage channels fail, the operation reports unavailable, never successful removal.

Rollback by reverting this ticket's application/worker changes. Do not erase unsynced admission queues. Existing scanner session cleanup remains the rollback prerequisite for devices holding private snapshots.

# Harness changes, if any

Three additive CI steps reuse existing disposable PostgreSQL and installed Chromium/WebKit jobs. Existing gates and timeouts are unchanged. See `docs/reviews/TICKET-065/ci-proposal.md`. The final verified source base is develop `5cedfab9` (dashboard097 and ticket-recovery224), merged in `9a6a41de`. Independent source and all144-frame visual review found no blocker; the24 updated stale frames were reviewed again.
