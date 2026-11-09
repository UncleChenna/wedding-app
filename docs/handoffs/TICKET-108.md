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
