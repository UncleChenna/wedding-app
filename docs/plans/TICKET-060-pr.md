# Ticket

TICKET-060 — Show scan results within one second with sound and vibration.

# Summary

A scanned QR now produces a readable pass-check result with the current guest,
party size, table and accepted arrival history. The camera stops and focus moves
to the result. “Valid pass” explicitly says no admission has been recorded; staff
cannot mistake this read-only foundation for TICKET-061's atomic admission flow.

# Changes

- Live gate authorization before input parsing and again after lookup; real signature
  verification before database access. Same-origin QR URLs are parsed, never fetched.
- Minimal repeatable-read projection of current table, canonical admitted count and
  accepted events. No contact, dietary, PIN or raw credential fields in result HTML.
- Green valid, amber used/unknown/not-replied and red invalid/revoked/replaced states,
  with text and icons. Unavailable storage and expired sessions have separate recovery
  copy. History identifies UTC server receipt and current staff/device labels.
- Camera shutdown, focused result, explicit Scan next pass and cancellation of stale
  lookups. Optional sound/vibration never delays the visual result; the cue explicitly
  means a pass check, not admission.
- Real camera/signature cached-fixture timing and authenticated production browser/SQL
  regressions. No migration, dependency or CI change.

# Acceptance criteria and evidence

- Cached-list result under one second: 12 Chromium/WebKit tests pass. Each uses actual
  camera pixels, actual signature verification and synthetic cached rows; measures first
  QR paint to rendered result, strictly below1000ms. Production still uses the live POST;
  persistent cached guest data remains TICKET-065, not claimed implemented here.
- Every result uses text plus icon; all six production states pass axe in all four themes.
- Actual signed pass retains its current table after assignment to a different table;
  clearing assignment shows Table not assigned. Live mobile/desktop browser passes.
- Blocked audio/vibration do not hide or delay results: feedback helper tests pass.
  New response/cancellation/auth tests also verify no stale private result leaks.

# Verification

Verified against integrated develop d0231fadf959f64ad4da7a010436b84c9b5d60e4.

- `pnpm test`: 1,615 passed,181 conditional skips,67.17s. Coverage98.27% lines,
  98.46% branches; every critical file meets its unchanged95% threshold.
- Cached browser:12/12 pass7.8s, including under1000ms for each actual scan.
- `RUN_SCAN_READ_DB_TESTS=1 ... vitest`:1/1 pass. Real admission triggers record2+1;
  reader excludes refused events, sees table reassignment and writes no new scan.
- Production build passes. Live result+existing camera browser4/4 pass1.7m; stronger
  final result rerun2/2 pass34.5s with pointer reassignment, focus and44px targets.
- Final `pnpm verify:quick` passes lint, types and45 focused tests (one conditional
  database skip). GitHub CI remains pending; full `pnpm verify` is required in CI before merge.
- Database evidence uses only owned disposable PostgreSQL16.14, not Supabase Auth,
  realtime or production. Database stopped with datadir and append-only synthetic
  evidence retained. No guards disabled or recorded arrivals deleted for cleanup.

# Risks and rollout

This is a read-only pass check: no admission or scan event is written. TICKET-061 owns
atomic admission and the post-commit welcome/enter wording;062 owns all-result logging;
065 owns persistent offline guest data;108 owns offline shell/session expiry. These
remain mandatory release requirements. A changed table/RSVP/admission after a read must
be checked again by061's locked write; a displayed result is never an admission grant.

Physical phones, camera/audio/vibration and day-of throughput remain unverified in the
existing TICKET-201 release gate under the user's preview authorization. No production
application is involved. Rollback is a code revert; no database rollback is needed.

# Screenshots

`docs/reviews/TICKET-060/{mobile,desktop}/`: six result states × four themes ×375/768/1280,
plus camera ready/permission recovery. Every result is real signed-pass/DB output using
synthetic data. Independent visual review is requested before readiness.

# UI checklist

- Screenshots: PASS automated capture; independent visual disposition recorded in review.
- Tokens: PASS shared semantic badges, Card and Button; no new hard-coded palette.
- Typography/restraint: PASS staff body18px+, large result/name/table and explicit status.
- Mobile: PASS375/600/768/1280 bounds;44px targets; valid name/table in375×812 viewport.
- Motion: PASS reduced-motion camera recovery; no result animation blocks presentation.
- Keyboard: PASS real keyboard capture/retry, focused result and keyboard Scan next pass.
- Contrast: PASS axe in every theme/state, text+icon independent of colour.
- Load/images: PASS existing scanner load CLS0; no photograph or font change.
- Performance: staff Lighthouse gate N/A; relevant cached scan timing strictly<1s proved.
- Copy: PASS explicit read-only limitation; welcome/enter copy reserved for committed061.
- Shared components: PASS existing Card/StatusBadge/Button; domain panel adds no UI primitive.
- Sharing: N/A no guest sharing change. Physical feedback/camera checks remain unverified201.
- QR output: N/A no generated QR output change; actual pixels decoded in browser fixtures.
- Staff feedback: PASS optional rejected/unavailable feedback tests and fixed semantic states.
- Verification: local full coverage/build pass; final quick passes; required full CI pending.
