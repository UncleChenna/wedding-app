# TICKET-036 — 26 October 2026

Owner divine; agent codex; branch TICKET-036. Base fdfa3ab716918a9ea3c9ed6dff088db795eeecf6. TICKET-023 PR41 merged after all required checks passed and is recorded done in the shared ledger.

## Current state

Claimed TICKET-036 through the CLI; managed worktree created with isolated project wedding-be0bb60d242c (database 33021, dev 33030, browser 33031). Dependencies installed with the locked package set. Initial setup failed because Colima was stopped. Starting the existing Colima instance succeeded. Resumed `AGENT_OWNER=divine pnpm wt:new TICKET-036`; the PostgreSQL container became healthy and full Supabase startup is still running. Recheck its live process before retrying. Token generation, bounded collision allocation and a safe resolver are now implemented. No acceptance criterion is complete because database persistence and the real route are still missing.

## Investigation

Read the ticket and relevant PRD token/security requirements, collaboration/learnings, current state and installed Next.js dynamic-route/not-found guidance. Next.js may send 200 when notFound happens after streaming; the acceptance test must assert real HTTP 404 for both unknown and revoked tokens. See the dated plan for proposed scope and verification.

## Next

Confirm setup exits successfully and applies migrations, then implement the failing token/resolver and real-route tests from the plan. Complete the implementation and full gate before making the PR ready. Keep personal data/token values out of logs. Do not touch the unrelated untracked TICKET-204 in the primary checkout.

## Tested increment

PR: https://github.com/UncleChenna/wedding-app/pull/42 (draft). New token and resolver suites first failed on missing modules, then passed all 20 tests. They cover 10,000 distinct 32-byte random tokens, input bounds, atomic-reservation callback retries (at most five), propagation of database errors, published invitation states, neutral missing/draft/revoked results and guest-only field projection. Targeted ESLint and Prettier pass. No database or browser test is claimed for this increment. The resumed setup process exited 1 with Supabase startup failure; no isolated containers remained in the next docker ps check. It is no longer live. Next implement Drizzle persistence and actual HTTP route behavior, then complete the full gate.

The pre-commit quick gate caught strict indexed-access errors in the collision test. Replaced direct call-array indexing with a set of captured tokens, retaining the two-call and two-distinct-token assertions; rerun the required gate before claiming this increment is pushed.

## Recovery after the tested increment

Commit 722b2f0 is pushed. The corrected pre-commit quick gate passed (lint, typecheck and all 20 related tests). Colima reports 4 CPUs and 6 GiB memory with several stacks running. Stopped only the completed TICKET-023 stack through `pnpm db:stop`; its output confirmed project wedding-13b237dc87ea and backup=true. No other stack or data was removed. Retried managed TICKET-036 setup after freeing that capacity; this new attempt is live. Revalidate it before any further restart.

## 27 October — persistence and route implementation

Managed setup succeeded after stopping completed TICKET-023: all services healthy, migrations applied. Added Drizzle creation/resolution, published-token Proxy check, personal route and minimal themed landing component. Two isolated PostgreSQL lifecycle tests pass; fixtures roll back. Production build passes. Eight initial production browser tests pass, including real 200/404 status, identical unknown/revoked UI, no-store/no-referrer/noindex headers and revocation after a visit. Twelve screenshots inspected; see docs/reviews/TICKET-036/README.md.

Initial full gate: 301 unit/database passes, build passed, 173 browser passes, 17 conditional skips, two route-inventory failures. Registered /i/invalid; valid-state coverage stays in the opt-in database suite. Added CLS=0 and >=44px target assertions. Second gate: 300 passes, one existing constraint query timed out at five seconds. No tests/timeouts changed. Docker had 54 containers. Stopped only completed TICKET-034 (wedding-0372a4a78ee3) and TICKET-195 (wedding-174c6ebcb152) through db:stop with backup=true. Recovery gate is running, log .harness/t036-verify-recovery.log. This is the current attempt; revalidate its process before any restart.

Next: inspect the recovery result, fix actual failures, record final UI/gate evidence, commit/push the implementation and use t:pr. Keep draft PR42 until final required checks pass. The earlier sections describe history, not the current healthy stack. Physical-device/Lighthouse release QA remains disclosed under TICKET-201 and the existing preview authorization.

Recovery gate ended: 301 unit/database passes and build passed; 181 browser passes, 18 skips, one failure because generic overflow expected 200 for the intentionally invalid-token fixture. Added exact 404 expectation only for that fixture (all other routes still 200); targeted overflow rerun passes. Both projects passed new CLS=0 and >=44px link assertions. All ticket acceptance criteria now have evidence; do not mark done until final gate and PR checks pass. Next run t:pr with RUN_INVITATION_DB_TESTS=1 and RUN_INVITATION_ROUTE_TESTS=1 so real local data-path tests participate.
