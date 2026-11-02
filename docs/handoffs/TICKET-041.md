# TICKET-041 — 2026-11-02

Owner divine; agent codex; branch TICKET-041. Base develop be0d656343ad3d31af0f904c3a8763c6f94dc598. Managed project wedding-60701471ccf6; DB33761, app33770, browser33771.

PRs48,68,74,75 were already merged when the user's approval arrived. Their owning tickets171,209,044,022 were marked done through the CLI after fetching develop. Completed stacks171/209 were stopped with backup retained. Primary checkout untracked ticket definitions were preserved.

## Implementation

Named guest/meal/dietary-note editor appears after yes. Party validator rejects missing names, foreign/duplicate identities, primary removal and over-limit additions. Transaction locks invitation, rechecks published/accepted state and configured timezone, preserves existing contact fields, edits only owned rows, removes omitted tag-alongs and derives attendance. Available meal IDs are offered; unchanged older choices may be retained. No schema/migration/RLS/CI/dependency change.

## Evidence and current work

Initial validation tests failed with missing module, then 11 passed. Six isolated DB cases pass with rollback fixtures. Combined focused suite:29 pass. Quick gate passed after fixing the new Server Action test mock to use Vitest's hoisted vi.mock (aliases were not hoisted). Production build passes. First browser test caught label-content-name-mismatch; corrected Remove guest accessible name, then all-theme flow passed in15.1s. All24 screenshots inspected.

Full verify is running, session99779, log artifacts/TICKET-041/verify.log. Do not restart solely if a tool observation expires; inspect the live handle/log. It includes RUN_PARTY_DB_TESTS=1. After it completes, rerun e2e/party.spec.ts with RUN_PARTY_BROWSER_TESTS=1 (includes newly added no-JavaScript guard). Performance helper artifacts/TICKET-041/personal-performance.ts is prepared; start production app33770 before running. It creates/cleans only its own isolated synthetic fixtures. Physical device/strict-zero release gates remain in201.

## Remaining

Signed-pass count integration, Lighthouse, final UI evidence, full gate result, commit/push and detailed PR. Do not mark complete before evidence. Keep ticket in_progress and use a draft PR while review remains unfinished.

## Setup lesson

Running wt:new from the stale primary checkout omitted Supabase's admin-code.html template. Retrying wt:new from this freshly fetched branch used the already-merged208 fix and completed setup. No generated file was manually patched.

Full verify session99779 exited0:789 unit/database tests pass,41 skipped;769 browser smoke tests pass,165 skipped. Final no-JavaScript focused browser rerun session18907 exited0 (18.4s); disabled editing and working attendance fallback verified. Source remains in progress; performance and signed-pass integration still pending.

## Published checkpoint

Implementation commit532dfd3 is pushed. Draft PR: https://github.com/UncleChenna/wedding-app/pull/76. Ticket stays in_progress; do not mark it complete or merge the draft. Remaining: signed-pass count refresh, three production Lighthouse runs and final UI/CI review. The four-PR merge exception does not authorize this PR. Working tree is otherwise clean.

## Final review evidence — 2026-11-02

Ephemeral-key signed pass review passes (scripts/review-party.ts,11.2s). Original issued pass reflects3 guests then2 after removal; dietary notes never appear there. Local-origin fixture correction retains all assertions. Three serial production Lighthouse runs pass: Performance98/100/100, Accessibility100 each, measured CLS0 each. Raw ignored reports and performance.log are in artifacts/TICKET-041. Measurement fixtures were cleaned up. No product source changed after full verify; only tests, review helper and evidence added.

Next: commit/push review evidence, run RUN_PARTY_DB_TESTS=1 AGENT_OWNER=divine VITEST_MAX_WORKERS=2 caffeinate -is pnpm t:pr TICKET-041, then check final-head CI and move draft to ready. Keep the physical-device/cold-font release gates in201; do not merge76 under the earlier four-PR exception.
