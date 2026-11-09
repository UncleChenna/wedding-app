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
scanner completion. Independent review requested after addressing earlier expiry
and connection-cleanup findings.

All owned database stacks are now stopped with backups;048 no longer holds a slot.
223 coverage repair PR143 awaits final full CI. Next: integrate verified059, build
minimal standalone document and generated required-asset manifest, wire authorized
worker save/navigation/logout and prove actual offline decoding. Keep142 draft.
