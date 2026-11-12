# Ticket

Ticket: TICKET-227

# Summary

Routine PRs currently run every browser and integration suite even when only documentation changes, and editing a PR description cancels its running checks. This change selects checks from the exact committed PR diff while keeping full release and historical-repair verification intact.

# Changes

- Always run format, lint, types and ticket validation. Use Vitest's dependency graph for changed feature sources and imported JSON; run directly changed tests too.
- Select mobile/desktop UI smoke and existing sensitive integration jobs. Unknown/shared/configuration/tooling changes, missing history and deletions select the full original matrix.
- Add an aggregate that rejects failed/cancelled/unexpectedly skipped selected jobs. Non-applicable jobs are explicitly reported as unrun.
- Preserve full original suites for main, release, manual dispatch, explicit `ci:full` PRs and conservative fallbacks. Historical repairs require an exact-head full proof and every original suite.
- Isolate edited PR text checks and metadata-only concurrency/check names. Base edits still run implementation verification; exact all-skipped metadata runs cannot hide newer failed/pending code evidence.
- Update canonical documentation and portable workflows; no product or database changes.

# Acceptance criteria and evidence

- Exact clean-checkout PR paths, unusual renamed filenames, deletions and divergent base changes: real Git fixtures.
- Actual indirect dependency selection: real Vitest subprocess fails the affected assertion, excludes an unrelated failure, then passes after repair.
- Selection/gate truth tables cover conservative scope, mixed documentation/source changes, JSON/UI assets, missing selection and cancelled/skipped results.
- Full repair provenance regressions reject targeted-only evidence and newer pending/failed runs while retaining valid proof past an exact metadata-only event.
- Current develop integrated conflict-free, including verified decoder repair PR #158. Exact-head hosted full CI remains the merge gate.

# Verification

- Final integrated selector/plan/parity/repair plus existing quick/admin harness tests: 51 passed in 6.67 seconds on develop `2a0cf958`. The actual latest-run regression retains full proof past metadata and rejects newer real failed/pending runs.
- Quick gate: lint/types and 38 related/parity tests passed. Normal commit hooks passed after the Git environment fix.
- Existing quick-parity fixture initially failed because its copied test gained a module dependency. The fixture now copies the actual runner dependencies; assertions remain unchanged. Existing quick-parity and admin-CI suites: 24 passed.
- Hook-only regression: the diff subprocess inherited Git repository redirection despite an explicit fixture cwd. It now strips inherited `GIT_*` variables for the read-only diff; all 12 selector/plan tests pass with an intentionally invalid `GIT_DIR`.
- `pnpm agents:link`, `pnpm agents:check`, `pnpm plugin:build`: passed.
- No local database or product browser verification required for this harness-only change. Hosted CI must run the full matrix because workflow/tooling scope is conservative.

- Hosted metadata-edit check: run `43202976665` skipped code work, PR-text run `43202976830` passed, and existing full run `43201080772` remained running. GitHub exposes skipped job names as unevaluated expressions; a captured-payload regression reproduced rejection, then 14 reconciliation tests passed after adding exact aliases. Independent review confirmed malformed expressions, failed jobs and duplicate names still fail closed. Final-head CI must pass after this fix.

# Risks and rollout

This is the owner's explicitly approved CI policy change. No paid services, dependencies, secrets, migration or production data operation. A revert restores the previous all-PR full workflow. Selection defaults to full for uncertainty, at the cost of slower cross-cutting PRs. Full pre-release verification and existing physical-device release gates remain mandatory. Branch protection is not changed. The `ci:full` label has been created; manual dispatch becomes visible when the workflow reaches the default main branch. Required outcome summaries distinguish unrun jobs from tested successes.

# Screenshots

Not applicable: no product UI changes.

# UI checklist

Not applicable to this harness-only change. Existing UI suites and release criteria are retained.

# Harness changes, if any

Adds conservative CI selection/verification/gating and full-run provenance, plus canonical workflow documentation. Does not disable hooks, assertions or test suites.

Independent review: root reviewed selection, workflow mappings and docs; a separate reviewer checked exact revisions, metadata event separation and historical repair provenance. Identified JSON-selection and metadata-run issues were fixed with regressions; no remaining review blocker.
