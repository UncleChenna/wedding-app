# TICKET-031 handoff

2026-11-03 · divine · codex · branch TICKET-031.

Started from develop df8a970 after TICKET-172 merged. Live ledger confirms the
claim and in-progress status. Isolated stack wedding-5f49479b1ba7 is running;
database port 27861, app 27870, Playwright 27871.

Draft PR: https://github.com/UncleChenna/wedding-app/pull/84.

Implemented the server-only credential helper and its behavioural tests.
Fresh random salts, asynchronous scrypt, constant-time digest comparison and a
bounded supported envelope prevent stored parameters from requesting excessive
work. Invalid input is rejected without normalization. No PIN or hash is logged.
The new suite first failed for the missing implementation, then all 12 tests
passed. Session signing adds four passing tests for device/key binding, expiry,
tampering and invalid issuance. Persistent attempt storage adds two passing real
database tests, including eight simultaneous attempts executing only five checks.
Migration 0011 is generated and applied only to this isolated stack. A repeated
migration preserves all counts (12 migration records); all 15 public tables have
RLS enabled. Exact-path commit/authorization-record approval was requested and is
approved by the user on 2026-11-03 and recorded in the ignored authorization file.
See docs/reviews/TICKET-031/migration-approval.md. Quick verification passes lint, types and 49 related tests
(34 opt-in tests skipped); the 16 new credential/session tests passed separately.
Full application verification and browser checks remain outstanding.

The authentication service now checks role, credential version and device/staff
revocation live, caps session expiry at the approved venue-local 06:00 cutoff,
and returns no PIN hashes. Three isolated database tests pass, including real
sign-in and live revocation. All 21 credential/session/cutoff unit tests pass;
the latest quick gate passes. The first typecheck caught generic inference
including undefined; an explicit result type fixed it without weakening strictness.
Cookie/action wiring and the gate/kitchen/bar sign-in pages are now implemented,
with a non-authenticating preview on `/dev/theme`. The signing secret is documented
in `.env.example` but no deployment secret is configured. Installed Next cookies,
connection and server-action docs were read. Request-time connection is awaited
outside the error catch so prerender control flow is not swallowed.

The development browser journey initially failed because a global PWA status
region made an unscoped locator ambiguous. Scoping to the sign-in form fixed the
test without changing assertions. Both development browser projects then passed.
Both production projects passed too (12.6s), including both role directions.
That build still logged caught prerender control flow; the request-time boundary
has since been corrected and the full gate is rebuilding it. The full gate's
unit stage passed 876 tests (65 skipped); browser/UI review is still pending.
Full gate log: `artifacts/TICKET-031/full-verify.log`.

Next: finish the running full gate, inspect all-theme screenshots, verify the
corrected production browser journey, record every UI checklist result and update
the draft PR. Do not mark the ticket complete before those checks pass.
Read installed Next docs before route/action changes. Prepare a concrete migration
proposal and obtain exact-path authorization for generated output. No production
database application has been performed. Administrative
staff creation stays in TICKET-096. This ticket is not complete.

## Final review continuation

The initial full gate finished with 876 unit passes, 65 skips, and a successful
build, followed by 766 browser passes, 165 skips and nine failures. The fixes are
scoped input typography, removal of the idle status role, and serial scheduling
of fixture-changing tests. The unchanged focused checks now pass (20 passes,
two opt-in skips). Never run database fixtures alongside the browser gate.

Additional review rejected duplicate PINs across roles, with a failing isolated
regression followed by three database passes. PIN tests now have 14 cases. The
corrected production journey passes both projects (14.3s). Twelve delayed-font
checks report exact zero CLS after making the staff header columns fixed and
start-aligning its label. The harmless theme preview passes without setting cookies.
Standard screenshot capture passed all 48 cases. The changed-form preview and
staff route contact sheets have been inspected at all three widths in four themes.
The development capture includes diagnostics from the shared screenshot harness;
production route captures will be used for the final review images.

A fresh full gate is running serially, logged in
`artifacts/TICKET-031/final-verify.log`. Next: finish that gate, publish the UI and
its evidence, and advance PR84 only after all mandatory checks are satisfied.
Migration approval is already recorded and committed; no additional approval is
needed for those exact files. No production database changes were made.

## Final gate result

Full verification exited 0: 878 unit passes / 65 opt-in skips, build success,
775 browser passes / 165 opt-in skips (8.3 minutes). Production source commit
393595a is pushed. Final route review images now come from the passing production
run; all three contact sheets and all twelve shared-form crops were inspected.
The initial failure log remains as history.

PR84 remains a draft. Physical staff-device/on-screen-keyboard evidence remains
unverified, with a user question pending about proceeding to review while retaining
release checks. Next: resolve that review disposition, complete the ticket notes
and run `pnpm t:pr TICKET-031`; confirm the final-head CI before requesting merge.
Do not claim production application or physical-device verification. PR83 merge
also still awaits its separately requested user exception.

## Review deferral approved — 2026-11-04

The owner approved proceeding to review while retaining physical-phone keyboard and
staff-device checks as release requirements. The exact checks are now unchecked in
TICKET-201, which blocks both releases. CLI resumed this ticket to in_progress.
PR83 was explicitly approved, merged and closed; integrated its develop commit
e051979 into this branch in 1adb8b9 without conflicts. Next run t:pr on the
integrated branch, publish actual results and mark PR84 ready after success.
The review deferral does not itself authorize merging PR84.

## Integrated review complete — 2026-11-04

Full t:pr passed on 87eaa57 (develop base e051979): 878 unit / 65 skipped,
775 browser / 165 skipped (7.3 minutes). CLI moved this ticket to in_review
in 0b551f1 and pushed PR84. The first integrated gate had one existing image-test
timeout: 877 passes/one failure. Both unchanged image tests then passed isolated
in 1.24s; the other observed verifier had exited. The full rerun used one unit
worker and passed without changing assertions or timeouts. All logs are retained.

Next: publish these evidence-only updates, make PR84 ready, check all five CI jobs
on the final head, and request an explicit merge exception before merging. The
user approved review/device deferral, not PR84 merge. Physical checks remain
unchecked and release-blocking in TICKET-201. No production database changes.
