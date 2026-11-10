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

Final full coverage is verified against develop a62da9ede750a1b03451c2702cceb4ec64d1b1af
through conflict-free merge d0826a2. Browser/SQL evidence was recorded on d0231fad;
048 integration did not change scanner source or its tables. Unchanged0025 migration
files were byte-checked against develop and carried under the user’s standing
authorization; the exact-path record was archived after the merge commit.

- `pnpm test`: 1,651 passed,185 conditional skips,70.81s. Coverage98.27% lines,
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

## CI scanner runner correction

The first final-head CI run passed six jobs, including full verification, but the
existing scanner journey lacked a QR-signing key. Its newly integrated reader
correctly returned unavailable instead of the test's expected Invalid pass. The
runner now generates an ephemeral Ed25519 pair and passes it only in the child
process environment, matching the configured production verifier prerequisite.
No production code, CI job, assertion or timeout changed. Independent review of
this six-line configuration correction is clean. The exact CI command,
`pnpm exec tsx scripts/test-scanner-journey.ts`, passes both projects (2/2,1.2m)
after the integrated production build and current migrations; quick checks pass.
Final-head CI must pass again before merge.

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
synthetic data. Independent source and visual review is clean: all144 result screenshots were
inspected across both projects, all states/themes/widths; no clipping, overlap or
blocking source issue remains. The conflict-free048 integration changes no060 behavior.

# UI checklist

- Screenshots: PASS automated capture and independent inspection of all144 result images.
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
- Verification: local full coverage/build pass; final quick passes; required full CI pending on the final published head.
