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
