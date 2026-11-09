# TICKET-059 — 2026-11-09

Owner divine, agent codex, root sole editor in .worktrees/TICKET-059; branch TICKET-059.
Started ahead of057. Base develop1f619b05; draft PR135.
Committed foundation62345fc1: three-second per-code throttle with3passing behavioral tests,
initial missing-module RED. Full camera implementation and UI verification outstanding.
Plan: docs/plans/2026-11-09-TICKET-059.md. No DB started; development port34390.

Next: implement camera lifecycle/native BarcodeDetector/lazy approved ZXing fallback with
actual video decoding tests. Gate auth must remain live. Manual search route does not
exist (063); do not fake its acceptance or link to404. Result/admission remains060.
Read installed Next use-client docs and staff-cookie boundaries (already inspected).
Official ZXing browser repository documents decodeFromVideoElement and BrowserQRCodeReader;
inspect installed API after adding generated dependency. No dependencies added yet.

221 editor owns combinedrepair PR131 atc63f916e, finalCI42625827888 running.
054 usermergedPR132 butCLIblocked until combinedrepair verified; handoff pushedc2499b52.
130 editorreview_ticket024 owns isolatedDB slot for order-concurrency verification.
134 editorreview_ticket098 paused waitingverified221merge beforefinalintegration.
128 draft133blocked027. Physicalphones remain unverified, not waived or declaredpassed.

Camera foundation update: generated @zxing/browser0.2.1 dependency and authorized lockfile.
Added camera-reader lifecycle/native detection/lazy ZXing fallback/torch/error mapping.
14 focused tests pass; verify:quick lint/types and11related tests pass. Permission
regressions caught cross-realm DOMException handling and remain unchanged afterfix.
Actual browser decoding/UI/auth integration still outstanding; early independent review
is assigned to review_ticket098. No camera route or completed acceptance claim yet.

Independent review found multi-code dispatch after first-result abort and pending torch
success after stop. Both reproduced RED (2failed/11passed), then fixed with per-result
stop check and post-constraint stopped check.16focused tests nowpass. Native/fallback
actual pixel decoding remains unverified; nextbrowser suite must cover it directly.

UI and browser update: signed-in /checkin now calls GateScannerEntry/Scanner; camera
start/pause,conditionaltorch,neutralQR-read feedback and real in-page help implemented.
No admission claim and no raw decoded text rendered.28focused tests pass.
Dedicated actual canvas.captureStream QR pixel suite passes4/4 Chromium/WebKit default
andforcedfallback (5.2s), /tmp/TICKET-059-camera-browser-stable.log.
WebKit fixture needed stable navigator.mediaDevices override; ephemeral method override
was lost and triggered realpermission rejection. Native detection now has200ms bounded
fallback; stalled-native unit regression passes. Camera UI uses explicit usergesture.
Route authentication/screenshot/axe and actualphone checks stilloutstanding. Manualsearch
063notimplemented; helpanchor is explicitly interim and doesnotcertify literalsearchcriterion.
221merged7250e483 allfiveCIgreen; integratefreshdevelop beforefinalverification.

SecondUI review: torchBusy remainedtrue after failure during pendinglightchange.
Regressionfailedthenfixed by clearingbusy/stalecontrols inonProblem. Nativecapability
probe now shares200msbudget withdetect; hungprobe regressionpasses.30focused and
4/4actualbrowserpixeltests passagain (/tmp/TICKET-059-camera-browser-budget.log).
Signed-in/deviceidentity text preserved for existingstaffjourney assertions.
NextDB: own059neverstartedSupabase; verify34381free and noowncontainer. NativePG16
fallback recipe from130 usesfreshmktemp cluster,assertDatabaseTarget,process-only
DATABASE_URL override,unchanged migrations; no.env edits. RootneedsrealstaffPIN
route tests (doesnotrequireSupabaseAuth),screenshots/allthemeaxe. No DB createdyet.
222harnessreconciliation awaitingrootread-onlyreview;134adminfinalCIrunning.

Actualrouteverification: freshnativePostgreSQL16.14 at34381,0publictables before
unchangedmigrations; process-onlyDATABASE_URL override retainedtargetguard. Production
build passes after221integration42bf1083. RealPINgate login,anonymous/wrongrole/revoked
session denial,deniedcamera/retry,actualQRpixels,trackcleanup,16theme/stateaxe scans,
375/600/768/1280overflow,44pxtargets andhardreloadCLS0 bothprojects pass. Latestbrowser
2/2pass1.2m (/tmp/TICKET-059-layout-cls.log); previous12.2s runwithoutcoldreload.
Screenshots4 in docs/reviews/TICKET-059 independentlyreviewedclean afterrootfixed
excessiveplaceholderwhitespace. NoSupabaseAuth/realtime/PG17orphysicalcamera claim.
TemporaryDB beingstopped withdatadirpreserved; path .harness/temporary-postgres-path.
Remaining: literalmanualsearchcriterion depends063; preserveCHK4whenclarifying
implementationorder. FullCI/finalcoverageonce130merges;057ledgerblockedawaits222
reconciliation although131actualrepairismerged. Noacceptanceboxfalselyticked.

2026-11-09 continuation: actual held-QR browser tests pass 4/4 in 20.7s,
including two deliveries at least 3,000ms apart in Chromium/WebKit default and
forced fallback. Quick lint/types pass (no related unit tests for browser-only delta).
Added CI camera-pixel job and real-auth scanner journey after existing guest journey.
Live TICKET-063 remains unowned/todo; its acceptance now explicitly carries the
mandatory denied-camera search/admission destination. TICKET-059 exposes interim
help honestly, avoiding the inverse dependency on 063. CHK-4 and release dependencies
remain intact. Native PG is stopped with its synthetic data preserved.
Independent delta review requested. Full CI and 057 ledger reconciliation still pending.

Coverage integration: develop500ba2d7 merged as8e79740c. Full unit suite passes
1,454 tests with156 opt-in skips in59.81s. All per-file critical gates pass;
camera96.8%lines/95.94%branches, aggregate97.9%/98.2%. Added14 meaningful
lifecycle/capability tests; independent review clean. Consumed lockfile approval
archived locally so existing protected-write hook tests remain meaningful.
CI env-file guard now optional (workflow-provided env still target-validated).
Held-QR callback stops its fixture aftersecondread; all4browsercases passagain.
Canonical PRbody: docs/plans/TICKET-059-pr.md. Three scope criteria proved and
checked;057ledger dependency and finalCI remain outstanding. No real-device claim.

Hosted run42636492227: invitation+authenticated scanner journey passes, tickets,
migrations and PR text pass; camera Chromium passes but LinuxWebKit exposes a
fixture-observation race (two correct reads already completed before polling the
transient first-read/live-video state). Recorded firstRead evidence at callback time
instead, asserting count1, usable readyState>=2 and512px width. Exact decodedpayloads,

> =3000ms spacing, no problems and endedtracks remain mandatory. Independent review
> confirms this corrects the oracle, not production behavior. Local4/4pass21.0s;
> new hosted verification still required. No timeout/decoder assertion removed.
