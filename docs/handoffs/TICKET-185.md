# TICKET-185 — 2026-11-04

Owner divine; branch TICKET-185. Live ledger: in_progress. Base develop
de24fbff52b70555e91c915cf5335ebc3cb2caf2. Isolated project wedding-da3e28ae7711,
app 37410, browser 37411. Do not stop other collaborators' stacks; the owner
explicitly directed continuing our own tasks when asked about WED-001 capacity.

Added the implementation plan and a server-only trusted-network identity helper.
The test suite first failed because the implementation was absent, then all 12
cases passed: untrusted forwarded headers, absent platform identity, malformed
addresses, IPv6 /64 grouping, mapped IPv4 normalization, keyed hashing and cookie
replacement. No endpoint currently calls the helper; this is an incomplete draft,
not deployed abuse protection. Full verification and database tests remain pending.

Next: design the PostgreSQL atomic expiring counter, add failing concurrency tests,
inventory invitation/pass/action entry points and integrate rate checks. Obtain
approval for concrete budgets using synthetic evidence and exact generated migration
paths before protected commits. No new migration, secret, policy or CI authorization
is implied. PR87's latest head lacks CI checks; do not merge based on its earlier run.

## Atomic store checkpoint

Implemented `request-budget.ts` and the additive Drizzle source table. Drizzle
generated `0012_request-budgets.sql`, its snapshot and journal entry. Applied only
to this ticket's database; repeat migration preserves every table/migration count,
and all 16 public tables retain RLS. Four opt-in tests pass in 1.29s, including
30 concurrent calls across two pools admitting exactly five. Quick verification
passes lint/types/45 related tests (51 skips); database cases ran separately.

Two earlier DB runs timed out, including the RLS read. No database lock waits were
observed. Only this worktree's Studio, metadata, Storage and Realtime services were
stopped to reduce Docker memory; the unchanged tests then passed. Restore those
four exact `*_wedding-da3e28ae7711` containers before full application verification.
Database/Auth/Kong stayed running. Other collaborators' stacks were untouched.

Exact migration commit/authorization-record approval is pending in the conversation;
see `docs/reviews/TICKET-185/migration-approval.md`. Generated files must remain
uncommitted until approved. PR89 remains draft, and no acceptance criterion is done.
Next implement the request wrapper, configured budgets, private retry responses and
all lookup/PIN entry points, then run end-to-end synthetic shared-network tests.

## Endpoint integration checkpoint

Connected the limiter to private GET/HEAD requests (including all three downloads)
and to RSVP, party and PIN server actions. Actions enforce their own gate so calls
through other routes cannot bypass it; Proxy leaves POST to the action to avoid
double counting. Network denial happens before device-cookie creation/PIN checks.
Vercel uses the existing STAFF_SESSION_SECRET for purpose-separated HMAC; other
hosts share one bucket and ignore forwarded identity headers. No secret was created.

Red boundary tests: seven Proxy failures and three action failures before integration.
After integration 21 focused cases passed; quick verification then found an existing
RSVP refresh unit test needed the new dependency mocked. All existing assertions
remain, and the corrected quick gate passes lint/types/24 related cases (five opt-in
database cases skipped). The explicit DB suite now has five passing cases, including
350 households × three requests within the proposed 1,200/minute network budget.

Production build passed. New HTTP/browser suite: four passes (4.4s), testing every
private read, forged headers, retry response privacy, expiry recovery and PIN lockout
after cookie removal on mobile and desktop. Existing guest journey: two passes
(4.5s); staff journey: two passes (9.5s). Tests ran serially, with owned fixtures
restored; no other ticket screenshots changed. Theme fallback warnings occurred
because this isolated stack has no selected theme row.

Two questions remain pending: generated-migration commit authorization and proposed
budgets (1,200 lookups/minute, 30 PIN attempts/10 minutes, in addition to the existing
five-failure device lockout). See rate-limits.md for evidence and tradeoffs. Full
verification and review of retry wording/UI/device requirements remain incomplete.

Full gate attempted after integration: format/lint/types passed, then unit tests
reported 932 passed, 82 skipped and three failures. All three failures are existing
stop-hook tests rejecting the unapproved generated `drizzle/meta/_journal.json`
before their fake pnpm process can run. Evidence: `artifacts/TICKET-185/full-verify.log`.
Do not weaken the hook or fabricate approval. After receiving the pending exact-path
approval, record it, commit generated output and rerun the full gate. The prior
production build and dedicated browser journeys passed independently; they do not
replace this failed full gate. No acceptance criteria have been checked off.

## Retry UI continuation

Added a native themed retry document to page-level denials; downloads remain plain
text. An attempted Next page rewrite failed actual HTTP tests (returned 200), so it
was removed. Native responses preserve 429/503, Retry-After and privacy headers.
The document uses safe registered light/dark tokens and existing local TTF assets,
requires no database/theme fetch, and retries the current URL through a native GET
form. It does not interpolate the private path. PIN waits now say minutes rather
than hundreds of seconds; protocol retry seconds are unchanged.

Build passes. Nine boundary unit cases and five budget-gate cases pass. Final browser
run: five passes/one intentionally duplicate visual skip in 9.5s; all 24 theme/width/
state screenshots inspected, Axe/keyboard/tap-target/overflow checks pass. Evidence:
`artifacts/TICKET-185/retry-{build,browser}.log`, screenshots and `ui-review.md`.
UI review remains incomplete: cold-font CLS, performance, physical devices, native
font-loading/shared-renderer exceptions and administrator-selected theme behaviour
are not certified. Do not mark done or silently move these to another ticket.

## Cold-font verification checkpoint

Added a six-variant cold-font regression test with exact-zero CLS assertions.
It fails in all six variants (baseline 0.0004118127–0.0220330954). A height/width
reservation experiment built successfully but also failed all six assertions;
that source change was reverted. Measurements are recorded in the UI review.
The new test is retained to expose the outstanding defect, not skipped or relaxed.
Migration commit authorization and launch-budget approval remain pending.
The live queue reports no ready next ticket. Leave other collaborators' stacks alone.
Next: diagnose font-swap source rectangles, resolve the layout shifts, then repeat
the browser matrix and full verification after migration approval.

## Cold-font correction verified

Continued independent work while migration/budget approvals remain pending. Added
source rectangles to the existing regression diagnostics. Matched fallback metrics
to the existing font registry, reserved heading/body space and removed a redundant
decorative label. Exact-zero CLS now passes all six default light/dark × width
variants. Full retry browser suite: six passes/two duplicate matrix skips, 12.5s.
Build and quick verification pass (nine related unit tests); all twelve changed
guest screenshots inspected. PIN screenshots unchanged. Full gate remains blocked
by migration authorization; performance/devices/native-font-loader review remain.
Next: measure production denial-page Lighthouse, obtain outstanding migration/budget
approvals and rerun full verification. No other collaborator's stack was touched.

## Retry performance verified

Three serial production mobile Lighthouse 12.6.1 runs: Performance 100/100/100,
Accessibility 100/100/100, CLS 0 throughout. Each real response asserted 429 and
no-store. Used Lighthouse's explicit ignore-status-code option to audit the error
document without changing its response; warnings retained in performance.json.
The local counter was restored and only the owned test server stopped. No dependency
was installed. No other collaborator's stack was touched.
Remaining: exact-path migration authorization, proposed launch-budget approval,
full verification, physical-device review and the native renderer/font-loader
exception. TICKET-032's base-update approval is also pending. No merge is authorized
for either current draft/review merely by these measurements.

## 4 November 2026 — native retry exception approved

Owner response: “Allow native retry page; retain device release checks.” Recorded
in the UI review and PR description. Native HTML and existing local fonts are
approved for the retry response; physical-phone checks remain release requirements
in TICKET-201 and are not claimed passed. No source or generated migration changed.
Remaining blockers: exact-path migration commit authorization and launch-budget
approval. After those approvals, record only the authorized paths, commit generated
output and rerun full verification before advancing the draft PR.

## Approval-evidence correction

Updated the migration and budget review documents to reflect completed endpoint
integration and the six passing browser cases; their earlier pending wording was
stale. No new test run or approval is claimed. The queue remains without ready
tickets; PR #87 still conflicts and awaits its base-update approval. Exact-path
migration authorization and proposed launch budgets remain unanswered.

## Migration and budgets approved — 4 November 2026

Owner approved both TICKET-185's migration/budgets and TICKET-032's base update.
Recorded exact TICKET-185 migration paths in the ignored authorization record.
Budgets are now approved: lookup 1,200/60s, PIN 30/600s, retaining device lockout.
Next: commit generated migration and rerun full verification, then proceed with
TICKET-032 sequentially. The request to streamline agent approvals must receive
its own harness ticket; do not weaken application security or failing checks.

## Authorized full verification passed

Full gate passed: 937 unit passes/82 opt-in skips, 775 browser passes/165 opt-in
skips (4.3m), formatting/lint/types/build pass. Log: approved-full-verify.log.
No checks bypassed. GitHub intermittently rejected ledger/branch writes with
commit_refs_rules/Internal Server Error; normal CLI retry updated ledger to
in_progress, while its branch push failed. Preserve commit 85429e4 and retry the
normal push with the approved migration commit. Next: publish and t:pr, then fix
TICKET-032's approved base update. Harness approval simplification remains requested.

## PR gate completed

The mandatory t:pr gate also passed on committed implementation a718f88: 937 unit
passes/82 opt-in skips and 775 browser passes/165 opt-in skips (4.6m), with all
other verification stages passing. CLI recorded in_review and pushed a04ab5f.
GitHub's PR head now matches that pushed commit. Generated migration is committed;
no pending local source changes remain. Next: confirm CI at the final published
head and human review; no production application or PR merge has been performed.
Continue TICKET-032's approved base update, then the requested harness streamlining.

## Integrating externally merged TICKET-032

PR87 was externally merged as develop 696baef1894bc639018bad7eff129506a6e32544
while local conflict testing was running. Its local ordering tests passed all eight
mobile/desktop cases; the checkout was reconciled without publishing a duplicate
merge, and CLI verified/recorded TICKET-032 done. Its isolated stack is stopped
with backup. The additional cooldown screenshot-path override is preserved under
TICKET-032 artifacts for a future harness change.

Merged that develop base into TICKET-185, retaining both request authorization and
guest budgets in src/proxy.ts. Nineteen proxy tests pass, including an exhausted
guest-budget case that still denies unauthenticated privileged calls and admits
an authorized admin. All existing assertions remain. Quick verification passes;
full PR gate must now run on this integrated code. No new migration changes.

## Integrated verification blocked by local failures

Integrated t:pr run exited 1: 985 unit passes/88 opt-in skips; browser 772 passes,
7 mobile timeouts and 165 skips (9.5m). Six of seven unchanged failed cases passed
in a serial recheck; the first private-pass navigation still timed out. The unchanged
direct two-pool limiter test also timed out at 5s. Do not treat earlier passing
verification as verification of the integrated head.

Read-only Colima memory check: 5,910MB total, 5,856MB used, 53MB available, no swap.
Only this worktree's unused Studio/metadata/storage/realtime services were stopped.
Other collaborators' stacks were untouched. Host db:counts succeeded. One aggregate
wait snapshot showed five transaction-id waits and one idle-in-transaction client;
causality is not proven, so recheck this after resource recovery rather than declaring
the problem solely environmental. Failure traces are preserved in
artifacts/TICKET-185/integrated-failure-results, with integrated-pr-gate.log,
integrated-failure-recheck.log and integrated-limiter-direct.log.

Next: recover capacity without touching another owner's stack, rerun the direct
limiter and private-route checks, investigate any repeat under healthy conditions,
then run the full gate. PR remains draft/incomplete; migration and budget approvals
are already recorded. TICKET-215 was reserved and its complete definition is in
the TICKET-032 worktree, awaiting its own branch.

## Resource recovery and unchanged regressions — 2026-11-04

Read-only capacity check showed 1,734MB available in Colima. Restarted only this
worktree's stack; every service reports healthy. All five unchanged distributed
limiter integration tests passed (5.61s total), including the shared two-pool budget,
expiry, RLS and 1,050 legitimate lookup requests. The exact remaining failed
private-route case passed unchanged: emerald-night `/p/invalid`, 888ms test / 4.1s run.
Logs: `artifacts/TICKET-185/recovered-db-start.log`, `recovered-limiter.log`,
`recovered-private-route.log`. This is evidence of recovery, not a claim that all
previous failures were exclusively environmental. No assertions/timeouts changed.

CLI resumed in_progress and published `07ce1f5`. Next: full integrated PR gate,
then update PR89 with final results and retain physical-device release requirements.
