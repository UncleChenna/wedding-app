# Ticket

Ticket: TICKET-065

# Summary

A valid dense signed QR could leave the offline scanner at “Ready to scan” because the fallback decoder failed to find the code at its original pixel scale. This follow-up adds one bounded fallback attempt per frame after an expected decoder failure, preserving native/full-size decoding, verification, delivery throttling and camera cleanup.

PR147 merged `f3fbb6b1` into `15227feb` while its full verification was cancelled. The reviewed decoder repair `e3a68467` was not included. This PR carries that repair and fresh integrated verification; cancelled checks are not treated as successful completion.

# Changes

- Keep native and full-size decoding first. After NotFound, Format or Checksum failures, retry once using a reusable canvas: half-size first, then original-size90/180/270degree orientations across successive frames. Both original dimensions must be at least320px; never upsample or retry below160px. Reset on decode success, dimensions change or a new reader.
- Retain a synthetic failing PNG and assert its exact decoded SHA256 in Chromium/WebKit, alongside repeated delivery timing and stopped camera tracks.
- Cover expected/unexpected errors, dimension bounds and canvas reuse in unit tests.
- Capture failure-only synthetic camera pixels and playback state in the existing CI artifact directory without changing assertions or timeouts.

# Acceptance criteria and evidence

All functional criteria are demonstrated by the authenticated browser suite and real worker tests. The actual production flow signs in, verifies private-field exclusion, saves a snapshot, reloads offline, decodes a signed QR from camera pixels, and checks fresh valid, stale valid, used, replaced and revoked states. Offline checks create no scan events; one explicit synthetic online admission demonstrates the used count. Keyboard sign-out physically clears IndexedDB.

The policy follows TICKET-169: five-minute refresh, immediate refresh after known changes, thirty-minute warning and session expiry. Disconnected changes on another scanner remain unknown until refresh. No email, phone, notes, credentials or signed bearer token is cached. Names are private local device data, not a public asset.

# Verification

Fresh follow-up base: develop `eb145497`, integrated as `9cf072db` on12November, includes the verified PR157 navigation repair. Focused frame-reader tests24/24 and camera browser8/8 passed on11November; lint/types quick passed. Fresh combined camera browser8/8 passes37.0s on12November. Final quick passes lint/types (no changed-source unit selection; explicit24-test decoder suite passed separately). Exact-head CI remains pending. The results below are retained historical implementation evidence, not a claim that this new head passed full verification.

- Production build passed, including the integrated TICKET-062/TICKET-225 base7533201c.
- Authenticated snapshot journey: **2/2 passed**, mobile and desktop, 42.2 seconds. All six states were checked in four themes at 375/768/1280; axe reported zero violations, controls met 44px and pages had no horizontal overflow.
- Existing online admission integration: **2/2 passed**, 31.3 seconds, preserving actual partial admission, immutable uncertain retry, duplicate receipt and concurrent refusal assertions.
- Existing authenticated offline shell integration: **2/2 passed**, 37.4 seconds, including exact zero initial CLS, keyboard refresh/sign-out and offline denial after logout.
- Exact generated-worker/real IndexedDB suite: **24/24 passed**, Chromium and WebKit, 15.0 seconds. Includes old-worker acknowledgement fallback, concurrent refresh/logout, shortened deadlines, missing authority cleanup, failed private erasure and full browser restart offline.
- Actual isolated PostgreSQL projection: **1/1 passed**. Private fields excluded; large named households retain all names with a bounded display label; revoked households preserve historical admitted counts. The transaction rolls back its fixtures.
- Focused admission/worker/wrapper tests: **38 passed**, including uncertain intent preservation when switching to read-only mode. Hook tests include the reproduced initial preparation-notification race. Pure parser/response/resolver targeted coverage reached 100% for the three new pure modules.
- Full unit/coverage gate on the reviewed checkpoint: **1,873 passed / 194 conditional skips**, 108.25 seconds; critical lines98.59%, branches98.89%, every per-file threshold passed. Quick passed lint, types and28 related tests; the earlier broader quick passed114. Checkpoint b9a511d6 passed all seven required CI checks in run42726899105. The later TICKET-062/TICKET-225 integration passed normal merge verification hooks; fresh exact-head CI remains pending.

After integrating scan logging and recovery fixes from develop7533201c, the authenticated snapshot journey passed **2/2 in59.3s**, and all144 regenerated screenshots matched the reviewed files byte-for-byte. Combined private-projection/scan-observation database tests passed **5/5 in1.25s** against the owned synthetic PostgreSQL. Inherited migration0027 and its snapshot/journal are byte-identical to develop; standing user authorization covers their integration and ignored exact-path record. No new migration is introduced by this ticket.

The combined live admission/logging browser also passed **2/2 in58.4s**, proving all authenticated verdict observations, partial admission, lost-response retry and concurrent refusal together with the snapshot wrapper. Native PostgreSQL26721 was then stopped with its data retained; no production or collaborator database was changed.

Final independent review found an additional known-change path: an admission refusal after a valid read did not invalidate its saved snapshot. Eight failing regressions reproduced the gap. `AdmissionResult.onOutcome` now reports every terminal authoritative result through `Scanner.onAdmissionOutcome`; uncertain results retain the same retry intent, receipts keep their existing completion callback, and session denial locks the scanner. An out-of-order erase acknowledgement regression also failed before adding a generation fence, so an older success cannot clear a newer failure's local cache lockout. All **35 related tests pass**. The rebuilt authenticated browser journey passes **2/2 in44.5s**, including real valid-cache → server revocation → admission refusal → failed refresh → physically empty private snapshot → offline unavailable, with unchanged positive admission evidence. All144 screenshot files remain byte-identical. Both reviewers found the bounded fixes clean; fresh final CI is still required.

Linux CI42732575530 exposed one WebKit signed-video decode timeout in the existing actual-worker test (45/46 passed). Camera-ready/saved-list context without frame pixels initially left the cause unknown, and five local repetitions passed. Failure-only synthetic fixture/video PNGs and playback/resource-path diagnostics were added to the output directory already uploaded by CI; diagnostic failures never replace the original assertion.

Those diagnostics subsequently reproduced the failure locally in Chromium and retained a sharp complete QR with51 delivered frames. The exact image is valid: normal ZXing detection fails at512px (including TRY_HARDER), while normal256px detection and the diagnostic-only pure decoder recover the same232-byte text. Four retained-image real-video cases failed before the fix in both browsers. The production fallback now retains native/full-size success, and only after NotFound tries one half-size nearest-neighbor canvas with both dimensions at least160px; the canvas is reused and unexpected failures still propagate. No PURE_BARCODE assumption, dependency, polling interval or timeout was introduced. All **8 real-camera cases pass37.6s**, comparing the exact payload hash and preserving ≥3s delivery throttling/track cleanup. The full actual-worker suite passes **46/46 in43.7s**. **47 decoder/lifecycle tests pass**, with camera-reader coverage97.27%lines/96.55%branches/100%functions under the existing per-file gate. Independent review found no blocker; physical-camera performance remains part of the existing device release gates.

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

This follow-up changes no harness configuration, dependency or CI step. The original merged implementation added three CI steps that reuse existing disposable PostgreSQL and installed Chromium/WebKit jobs. Existing gates and timeouts are unchanged. See `docs/reviews/TICKET-065/ci-proposal.md`. That earlier source checkpoint was develop `7533201c` (including scan logging062 and recovery225), merged in `eb37685c`. Scanner timestamp/oversized-QR handling, immutable observation evidence, and all offline wrapper props remain intact. Independent source and all144-frame visual review found no blocker; the24 updated stale frames were reviewed again.

## Final Linux failure and orientation repair

Run43194895337 failed one WebKit offline-worker QR assertion (45/46 worker cases passed); other pending jobs were subsequently superseded by the required status push, not certified successful. Its saved512px video had47frames and a complete synthetic QR. The exact PNG now lives beside the first decoder regression, with exact decoded SHA256 documented. All four real-video cases reproduced failure before repair. Half-size-only rotations still failed in Chromium because canvas resampling differed from the diagnostic image library; original-size270degree normal detection succeeded in both engines.

The repaired bounded cycle keeps native/full-size first and adds at most one fallback decode per frame, without increasing frame rate, streams, timeouts or bypassing signature verification.25 focused unit tests and12 real camera browser cases pass (54.9s), retaining exact payload,3second delivery throttle and stopped-track assertions. Actual-worker46/46 passes40.6s; full frame/lifecycle48tests pass with97.65%lines/95.95%branches on the changed decoder under unchanged95/95thresholds. Quick passes lint, types and48relatedtests. Fresh Linux CI remains required before merge.
