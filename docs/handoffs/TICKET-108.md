# TICKET-108 — 2026-11-09

Owner divine / codex, root sole editor, branch/worktreeTICKET-108. Base92451762
includes merged173. Started throughsupported--ahead while059readyPR135awaitsfinalCI.
No DB started. Ports26810dev/26811browser, projectwedding-d05cffa4b73e.

Shared auth expiryfoundation: authenticateStaffSession returns livecheckedidentity
and min(cookieexp,currenteventcutoff,currentPINexpiry). ExistingauthenticateStaff
returnsidentityonly unchanged. currentStaffDevice exposessameexpiry and rechecksafter
namequery. Eightnewexpirytests+foursessiontests pass; initialmissingAPIred6fail1pass.
Independentreviewclean; postDBdeadline regression added fromreview. NoofflineUIor
workerimplementationyet. Rootowns sharedstaff-auth/staff-cookies;060willconsumeAPI.

Plan docs/plans/2026-11-09-TICKET-108.md; canonicaldraftbodyTICKET-108-pr.md.
Need secureworker-owned authorizedsave, exactcanonicalnavigation, allassetsrequired,
sessionisolation/logout/expiry/concurrencyevidence, actualdecoder/offlinereload.
No guestdata-cache or admissionwrite inthisscope. CurrentAPI not yetwiredtocache.

Sharedblocker:173scan-synccoveragebelow95% wascaughtby059finalCI42662095945;
024reviewagentcreatingseparatefix.059camera/admin/guestbrowserjobs passed; don't
merge059untilfixedfinalCI.128readyPR133realRLS/realtime16pass;048ownsDBslot now.
Roottemporarycaffeinatesession73726expiresautomatically; previouslocaltimingfailures
wereconfirmedmacOSsleep, not a reason to raise testtimeouts. Usecommandscoped-is.

Foundation publishedaba5d865, draftPR142:
https://github.com/UncleChenna/wedding-app/pull/142
Independentexpiryreviewclean; addressedpost-namequery deadline and addedcross-query
boundarytest. Latestfocused12pass; quicklint/types/18relatedpass with1optinskip.
ArchitecturepeerreviewrejectsblindfullNextHTMLcaching. Concreteplanupdated forminimal
standalonedocument, same-responsegrant, generatedclosedassetbundle and atomicIDB
invalidationgeneration. esbuildprobeactual059Scanner+ReactDOM729926bytes,zeroexternal
imports/serversources; artifacts/tmp/TICKET-108-scanner-probe*. No runtimeoffline
implementation or pre-cache acceptance claim yet.
059nowCLIblocked7e1f27b1/draft135 onshared223coveragefix (PR143final8fa7005eCIrunning).
060blockedawaits059, draft139.128ready133holdsforcombinedcoveragefix.048DBslotactive.
Nextroot: implementworkerstore/generator/minimaldocument with tests; integrate059only
afterverifiedmerge. Do not deletequeues or loosen device expiry. Rootsole108editor.

## Storage checkpoint — 2026-11-09

Root remains sole editor, in_progress, draft PR142. Added
`src/modules/checkin/browser/scanner-shell-store.ts`,
`scripts/browser-tests/scanner-shell-store.spec.ts` and
`scripts/scanner-shell.config.ts`. Dedicated IDB authorization transaction/generation
prevents stale publication after logout/new preparation; tokens publish once. Input
and persisted metadata validation fail closed. Expiry is checked after asynchronous
opening and again after transaction completion. Synchronous malformed-database setup
closes its connection. No guest-data database is accessed or removed.

Initial missing-module browser run was red. Final browser suite:16/16 pass across
Chromium/WebKit, including a genuinely separate worker reading and invalidating the
record. Logs `/tmp/TICKET-108-store-worker.log`; final quick lint/types pass with no
affected related-unit tests (`/tmp/TICKET-108-store-final-quick.log`). This is not a
claim of service-worker integration, quota handling, asset readiness or offline
scanner completion. Independent follow-up review is clean after addressing expiry and connection-cleanup findings. The reviewer checked the actual separate-worker test, corruption recovery, single-use generation and post-transaction expiry checks.

All owned database stacks are now stopped with backups;048 no longer holds a slot.
223 coverage repair PR143 awaits final full CI. Next: integrate verified059, build
minimal standalone document and generated required-asset manifest, wire authorized
worker save/navigation/logout and prove actual offline decoding. Keep142 draft.

Storage checkpoint committed and pushed as232d6d54 to draftPR142; all219 ticket definitions validate. Root remains active on108. Next integration is still gated on223 then059; no offline-ready acceptance criterion was ticked.

## Required-asset runtime checkpoint — 2026-11-09

Added scanner-shell-runtime.ts and ten unit regressions. Server-owned fixed endpoint
and response marker precede validation/asset work. Every asset must have complete
nonredirected response and expected MIME and survive cache readback before commit.
Fallback checks full grant equality after checking its assets, preventing a newer
inventory with identical session/timestamps from bypassing readiness. This race
first failed (1failed/9passed), then passed after the equality check. Runtime is
not wired into shipped worker yet and endpoint/bundle generator remain outstanding.

Storage adds authorize and conditional discard. Both compare the preparation
generation transactionally; replaced session loses the old shell before downloads;
matching denial clears and consumes the token, stale denial leaves newer state.
Independent incremental/runtime review clean; reviewer-requested MIME/eviction
cases added. Browser suite20/20; runtime10/10. Logs /tmp/TICKET-108-store-final20.log,
/tmp/TICKET-108-runtime-final.log, /tmp/TICKET-108-runtime-quick.log.

ExternalPR141 verified merged develop3e75175e and independently fixes the shared
critical coverage blocker.223 now retains both that narrow test and broader
regressions, awaiting new combinedCI.128/048 editors integrating currentdevelop.
Root next checkpoints108 then resumes059 integration/CI, which108 still requires.

## Known authorization changes — 2026-11-09

Resumed through CLI --ahead asbc77ab65 while059is in_review. Rootsoleeditor.
Independentreview identified same-fingerprint shorter serverdeadline retaining an
olderlongerlivedshell afterassetfailure; rootalsoidentified replaced-session
responseonnewbuild being rejectedbefore invalidation. Six realbrowserregressions
failed first (threecases×Chromium/WebKit). Storeauthorize nowreceives trusted
deadline, discardsoldHTMLifsessionchangesordeadlineshortens, andconsumesexpired
preparationinsideIDB. Runtime appliesknownauthorizationbeforebuildcompatibility
andconditionallydiscardsalreadyexpiredgrants. Do notmerelyclampmetadata:oldHTML
canembedthelaternown-invaliddeadline. Independentfollowupreviewclean.

Fullbrowser26/26pass; runtime10/10pass; quicklint/types/relatedtests pass. Logs:
/tmp/TICKET-108-known-session-red.log, -green.log, -unit.log, -quick.log.
059readyfinalc1abf14a actualbase9669c0ce,1555unitpass,CI42682799555watch42180.
128donePR133merge9669c0ce;223donePR143merge5338f85d.048agenthandlesitsfinalCI.
No shippedworker/endpoint/bundlegeneratorwiredyet. Nextimplementdeployment-safe
assetmanifest/generator thenauthorizedminimaldocument andworkerintegration. PRD
usesVercel, so runtimegeneratedmanifestmustbetraced correctly; architecturepeer
reviewrequestedbeforechoosingpostbuildfilehandling. Keep142draft.

Prebuild generator nowimplemented scripts/scanner-assets.ts with3passingtests:
closeddecoderbundle, deterministichashes/sharedCSS/fullfontassets, servermodule
exclusion. Rootbuild/productionentrynotwiredyet. Storeallowscontenthashedscanner
CSS/WOFF2; itsnewacceptancetestfirstfailed2thenfullsuite28/28passes. Quickpasses
lint/types/relatedunit. Logs/tmp/TICKET-108-assets-{red,green,browser,quick}.log.
Independentgeneratorreviewclean. Realentry/stylechecksandfail-fastrootbuildwiringremainrequired; keepwrappersourcedclassesdiscoverable. Architecturedecisioninownplan rejectsmutable
postbuildmanifestdueNext/Vercelpackaging evidence; requiresimmutableprebuildassets
andpackagedchecksumverification. NativeofflinefontCSSsharesonlinefontfiles/metrics;
onlineNext/fontunchanged, actualUI/CLSchecksnotyetproved.

## Authorized endpoint — 2026-11-09

Added server/scanner-assets.ts (strict completeinventory+digestparser/freshfile
read) and server/scanner-shell-response.ts, routedat/checkin/offline-shell.
UseslivecurrentStaffDevice(gate), trustedexpiryrecheckaftertheme/manifestreads,
domain-separatedHMACcookie fingerprint andno-storeminimalHTMLgrant. No names,
rawcookie, NextFlight/serveractions inHTML. Securityheaders preserveCSP/camera
policy. Routeinjectsthemeloader toavoidfeature-servercrossimport. Missingbuild
assets503; missing/expiredliveauthority401. Actualproductionentry/buildmanifest
arenotwiredyet,sothisisnotofflinereadyproof.

IndependentreviewfoundNextcontrol-flowcatch: realnotFound regressionfailed
1/6passed, thenfixedwithunstable_rethrowfirstincatch. Ordinarybackenderrors
remain503withoutdetails; missingkey/cookie401. Finalendpoint/manifest/generator
suite19/19,quicklint/types/relatedtests pass; followupreviewclean. Logs
/tmp/TICKET-108-endpoint-{red,green,rethrow-red,final,final-quick}.log.
Next059CI42682799555stillfullverify; sixotherjobsgreen. Keep142draft andfinish
actualscannerentry/prebuild/tracing/worker/clientpreparation/offlinereloadchecks.

## Real entry and build checkpoint — 2026-11-09

TICKET-059 is done: PR135 merged as d0231fad after all seven checks passed at
c1abf14a; completion dce699e9 was pushed. TICKET-108 integrated that base cleanly
as 3c848c4d. The unchanged lockfile matched develop blob
919aa84a115cd76c0203ae4973bd115a1432cb3c. Standing user authorization was recorded
for that exact path, then archived locally after commit; the frozen install passed.

The real standalone entry now bundles Scanner and a ScannerSession boundary.
Five lifecycle tests pass: exact expiry, delayed click, invalid deadline, clock
rollback and worker invalidation. Scanner.tsx remains owned by TICKET-060's editor
and was not changed here. The boundary unmounts its child through existing camera
cleanup. Real browser track shutdown is still unverified.

The build runs the generator before Next and explicitly traces its final manifest
for /checkin/offline-shell and /sw.js. The production build passes; seven generated
assets match their SHA-256 names and both NFT traces include the final manifest
(SHA-256 93c12d7e6c1ceb66e575a3cad99ea8e98e715df5ea78ed3c554d0fd2266f3777).
This proves local asset integrity/trace inclusion, not a Vercel deployment.
Generated output is ignored by Git, lint and formatting; source rules remain intact.
The first quick run failed because it linted minified generated JS; the scoped
output exclusion fixes that without relaxing source checks. Final quick passes.

Logs: /tmp/TICKET-108-entry-quick.log (failure), -entry-quick-fixed.log (pass),
-entry-build.log (pass), -session-ui-final.log (five pass). Independent review clean
for this slice. Reviewer requires durable worker authorization reconciliation on
initial attachment: an invalidation broadcast can arrive before subscription.
Add document session/build identity and verify it against the durable grant before
enabling the offline camera; a deadline alone is not sufficient.

Next: wire worker save/status/invalidation/navigation and public asset serving;
add the online preparation/logout bridge; verify actual offline reload and expiry
with QR pixels, all themes and production endpoints. Keep PR142 draft. Agent024
owns060 result code and a native PostgreSQL fixture on30821. Agent theme_fixes
owns048 final CI42687100122, with the next merge slot reserved. Root uses no DB.

## Worker checkpoint — 2026-11-09 20:17 UTC

Root remains sole editor108/in_progress; PR142 stays draft. Added worker install function,
canonical client message validation, network-first /checkin fallback, status identity checks,
activation build invalidation and build-specific public cache. /sw.js route loads traced
manifest; missing assets return503 instead of replacing a good worker. Exact non-null emitted
worker source executes in VM. Runtime revalidate does no asset downloads and consumes known
denials only when generation discard succeeds. Failed denial persistence has an explicit
outcome; worker latches unavailable and deletes scanner readiness cache, then notifies tabs.
No guest snapshot or queue deletion. If both durable channels fail, no successful removal
acknowledgment or restart-safety claim is made.

Offline entry adds session/build attributes and initial durable STATUS match before camera
mount; incoming invalidation wins over pending replies, earlier deadline always wins. Six
new lifecycle tests pass. Reviewer theme_fixes found missing notifications for null prior
state/storage failure, plus failed-discard recovery; fixes and regressions included. Final
followup review pending. Quick passed lint/types/82 related tests after fixing a forbidden
inline import type in a test. Logs /tmp/TICKET-108-worker-{runtime-red,quick,quick-fixed,final-quick}.log.

Next: online GateScannerEntry preparation/retry and awaited logout bridge; actual browser
worker+bundle offline reload with QR pixels, IDB failure/cache fallback/restart tests; real
production authenticated endpoint, themes/accessibility/screenshots/build/CI. Scanner.tsx
still060-owned; do not edit. Latest060 final source/144screens independently clean, integrated
base a62da9ed and1651unitpasses; final publication/CI pending. 048 merged PR103 a62da9ed,
done metadata9df99903/evidence0093f1dd. No108database running;060nativePG stopped with backup.

The follow-up review found a pending-save/failed-logout race. Scanner publication,
invalidation, status/document reads and activation now share an origin-wide Web Lock,
including across worker versions. Missing coordination fails offline use closed while
online navigation remains available. A deferred-publication regression verifies logout
removes readiness after the pending publication finishes. Browser worker restart and
storage-recovery proof still remain; no full offline-ready claim is made.

Follow-up review added cross-build invalidation and bounded network work: failed
invalidation removes only all `wedding-scanner-assets-v1-*` caches, preserving guest
caches. Authorization plus required asset downloads share a ten-second deadline;
response bodies are fully consumed while abort remains active, before JSON/cache
publication. Never-resolving fetch and stalled-body regressions pass. Final quick
lint/types/72 affected tests passes; all28 existing Chromium/WebKit real-IDB tests
pass7.0seconds. Earlier worker checkpoint quick had83 affected tests; counts differ
because its files are now committed. Logs: /tmp/TICKET-108-worker-bounded-quick.log
and /tmp/TICKET-108-worker-store-browser.log. Real worker restart and offline camera
reload remain next; this storage-suite result does not certify that end-to-end path.

## Controls and real-browser checkpoint — 2026-11-09 21:25 UTC

Root sole editor108/in_progress. Added online preparation/status/retry and enhanced signout,
plus native POST worker invalidation. Shared clearStaffSessionAction preserves normal signout
redirect behavior while enhanced scanner clears saved access after cookie deletion too.
A shared server HMAC fingerprint binds online and offline identities. Replacement broadcasts
carry only authorized identity/deadline and don't lock the matching new tab; failures while
publishing assets still preserve that authoritative identity. Removed redundant post-operation
storage reads that could suppress already-known denial/replacement notifications. StrictMode
preparation and delayed signout regressions pass. Status text reserves height and keeps a refresh
button to reduce layout movement; measured online CLS still needs verification.

Actual Next production auth test exposed proxy redirect/signinHTML instead of denial for
/checkin/offline-shell. Added exact-path401 denial without bypassing credential/role checks;
regression failed then passed. Fresh build and real mobile/desktop PIN/preparation/offline
reload/enhanced logout journeys pass2/2. Synthetic native PG used own verified26801, initialized
empty, applied unchanged migrations, then stopped retaining .harness/temporary-postgres-path.
No Supabase Auth/realtime claim. Logs /tmp/TICKET-108-native-{empty,migrate,stop}.log,
/tmp/TICKET-108-auth-browser.log (initialfailure), -auth-browser-fixed.log (pass),
/tmp/TICKET-108-proxy-build.log. No database running now.

Real worker fixture runs exact emitted worker and generated Scanner bundle through loopback
HTTP. All46 combined storage/worker Chromium/WebKit tests pass36.4s, including QR pixels,
expiry/track shutdown, missing decoder, native POST, full persistent-profile browser restart,
and injected IDBfailure->cachepurge->restart. Test-only failure injection is in the fixture;
production worker has no fault-control channel. Four themes×3widths×2engines screenshots
copied under docs/reviews/TICKET-108. Reviewer098 inspected all24 with no visual findings;
reviewer theme_fixes source/CI review clean before tiny final reserved-height style.
Final quick lint/types115relatedtests pass. CIproposal adds2existingjobsteps without
removing checks/timeouts. Logs /tmp/TICKET-108-combined-browser.log and -controls-final-quick.log.

Next authoritative state: TICKET-060 PR139 merged at21:24:19 as2df977c6 after all7checks at
4b320aea. Agent024 is recordingdone/evidence. Commit this checkpoint, integrate develop
2df977c6 into108, adapt real offline bundle tests to060 result semantics without dropping
actual QR-decoding evidence, rerun final production/auth/visual checks andCI. Keep142draft
until integration proven. New Scanner includes live read-only resolver; persistent offline
snapshots/admission still065/066/180, not108. The latest worker optional diagnostic-read
removal is covered by emitted-worker tests but occurred after last authenticated Nextbuild;
final build/auth run after integration is mandatory. Goal remains active, no blocker audit.

## Integrated completion checkpoint — 2026-11-09 21:45 UTC

TICKET-060 is done and merged as `2df977c6`. TICKET-108 integrated that base cleanly
in `b2b6a7d`, after checkpoint `9ed03ec8`. Three unchanged 0025 migration files
matched develop byte-for-byte. Standing authorization was recorded and archived
as `.harness/approved-writes.consumed-2df977c6.json`. No new migration was created.

The pixel test now proves the real TICKET-060 behavior: the exact decoded QR reaches
the live POST, an offline read reports unavailable rather than admission, and a
second capture on blank frames stops at session expiry. All 46 combined browser
checks pass in 42.4 seconds. All 24 updated offline screenshots were copied and
independently reviewed. A regression also verifies that decoded response bodies do
not retain their wire compression/length headers.

The integrated production build passes. The owned PostgreSQL fixture on 26801 was
restarted and received unchanged migration 0025. Both production browser projects
pass PIN authentication, preparation, offline reload and enhanced sign-out. Eight
additional production screenshots, all-theme axe checks, initial CLS of zero,
reduced motion, keyboard refresh and Tab/Enter sign-out were verified. All eight
screenshots passed independent visual review. Recorded refresh took about 158 ms
and sign-out about 27 ms once the page was ready; the longer fixture time occurs
in earlier loading/theme checks. This is not a guest performance or physical-device
claim. The database is stopped with its backup retained; see
`/tmp/TICKET-108-final-stop.log`.

Full `pnpm test`: 1,733 passed, 185 conditional skips, 69.09 seconds. Critical
coverage is 98.27% lines and 98.46% branches. No checks were weakened. Source/CI
review and all 32 image reviews are clean. `docs/pwa.md` and the itemized
`docs/reviews/TICKET-108/ui-review.md` record the final behavior and limits.
Acceptance criteria are checked on actual evidence; status must remain in review
until final CI and merge. Physical installed scanner QA remains in TICKET-114.

Logs: `/tmp/TICKET-108-integrated-{browser,build,auth,coverage,quick}.log`,
`/tmp/TICKET-108-keyboard-auth.log` and `/tmp/TICKET-108-timed-auth.log`.
Production timing JSON is retained with the review images.

Next: finish quick verification, commit and push; use normal `t:pr` to ready
existing PR #142 and record review status. Monitor all seven checks on its final
head; merge only after they pass and the current base/conflicts are checked. Then
record done through the CLI and continue the queue. The goal remains active.

Agent024 now owns TICKET-061 / PR #144 and database port 36261. Its admission
foundation passed early independent review; UI and final checks are still pending.
Its final merge waits for TICKET-108. No TICKET-108 database is running.
