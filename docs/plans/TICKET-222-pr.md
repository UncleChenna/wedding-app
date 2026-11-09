# Ticket

Ticket: TICKET-222

# Summary

An externally merged ticket can remain honestly blocked after a failed CI run, even when a later verified repair fixes the combined baseline. The ordinary workflow cannot close it because its intermediate review state requires an open PR. This adds an explicit, evidence-based reconciliation command without weakening normal transitions or inventing a second review.

# Changes

`pnpm t:reconcile <id> --repair-pr <number> --reason <explanation>` operates on owned blocked/in-progress tickets only. It requires both original and repair PRs merged into develop, fresh Git ancestry from the original merge through the repair's tested head and merge to current develop, complete original criteria in both tested and current trees, and completed blockers.

The latest `ci.yml` pull-request run must match the repair head, complete successfully, contain every standard CI job, and have no unsuccessful additional jobs. Repair metadata and latest run are checked again before writing the shared ledger. Original PR/history stay intact; activity records the original block reason, repair PR/head, run URL, develop commit and explanation. Other worktree files are not rewritten. No force or offline mode is offered.

# Acceptance criteria and evidence

Initial focused regressions pass 74 tests including a real Git/shared-ledger matrix. Failure cases preserve the ledger and ticket file; successful cases record the exact evidence. Additional race cases reject a newer CI run and a different-repository PR. Quick verification passes lint, types and 76 related tests. The final same-run restart regression also passes in the 20-case CLI matrix; two additional cases prove local/offline ledgers are refused.

Actual TICKET-057/054 reconciliation is a post-merge operation. Neither ticket has been manually changed by this implementation. Their original failed CI history remains truthful and their physical release gates remain mandatory.

# Verification

- Red: the initial CI-evidence tests failed before the new module existed (`/tmp/TICKET-222-red.log`).
- Green: initial 74 focused tests passed in 58.14 seconds (`/tmp/TICKET-222-focused.log`).
- Typecheck passed (`/tmp/TICKET-222-types.log`).
- Quick verification: lint/types and 76 related tests passed (`/tmp/TICKET-222-quick.log`). Final same-run restart hardening: 20 CLI cases passed, 48 unrelated cases excluded by the focused filter (`/tmp/TICKET-222-races.log`); final typecheck passed. Final complete-tree quick verification passes lint/types and all 70 related ticket tests (`/tmp/TICKET-222-final-quick.log`). Full CI is required before merge.
- The first local/offline fixture run accidentally retained origin mode and failed its two refusal expectations. Correcting the explicit fixture environment produces 2/2 passes (`/tmp/TICKET-222-ledger-modes-green.log`); the refusal assertions were unchanged.
- No database required or started by current tooling. The primary checkout's stale setup wrapper attempted startup and failed; resumed setup with current tooling, and the owned project has no containers.

# Risks and rollout

This recovery command is intentionally stricter than ordinary closure: historical stacked PRs, squash histories that cannot establish tested-head ancestry, skipped jobs and missing workflow access refuse. It cannot certify whether a repair semantically fixes a bug; independent review and the recorded explanation provide that link, while ancestry/CI prove the tested combined implementation. It does not waive device testing. Removing the new command rolls back availability without changing existing transitions or prior ledger history.

# Screenshots

N/A: CLI-only change.

# UI checklist

N/A: no UI changes.

# Harness changes, if any

Adds the explicit recovery command and failure-case tests; retains all normal owner, dependency and transition guards. No hooks, tests or timeouts are weakened.

# Independent review

Independent read-only review found no blockers in the evidence helper or final CLI integration: ownership and dependencies are rechecked inside the atomic ledger callback; origin-only mode, criteria, exact-head CI and ancestry remain fail-closed. The reviewer also checked the real-ledger failure matrix and same-run restart guard. No physical release gates are waived.

# Integration failure and bounded repair

Final run [42633880639](https://github.com/UncleChenna/wedding-app/actions/runs/42633880639) failed one existing guest-import test after 1,428 unit passes and 156 skips. Its `findByText` resolved with error content rendered but the asynchronous focus effect had not completed (submit still showed pending in the failure DOM). The test immediately asserted focus synchronously. The narrow authorized integration repair wraps that identical `toHaveFocus` assertion in the existing `waitFor`, preserving its default timeout and every no-write/no-import assertion. No component code, acceptance behavior, test timeout or CI gate changes. Original failure remains recorded; focused repetition and fresh final CI are required.

Post-repair verification: five consecutive full guest-import component-suite runs passed 10/10 each (50 total), logs `/tmp/TICKET-222-focus-{1,2,3,4,5}.log`. Quick verification passed lint, types and all 10 related tests (`/tmp/TICKET-222-focus-quick.log`). Fresh required CI remains the merge gate.

# Coverage baseline integration

Integrated verified develop `500ba2d7` without conflicts in `9208598`; retained the new coverage test command and unchanged generated lockfile. Complete local `pnpm test` passed **1,441 tests**, with **156 environment-gated skips**, across 181 passing/33 skipped files in 106.42 seconds. Coverage passed: **98.83% statements, 99.28% branches, 100% functions, 98.54% lines** (`/tmp/TICKET-222-integrated-coverage.log`). The normal integration commit quick gate also passed. No database was started. The earlier CI head is superseded by this combined base; fresh final-head CI remains mandatory.
