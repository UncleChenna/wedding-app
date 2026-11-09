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
