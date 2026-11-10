# Ticket

TICKET-226 — Run quick CI parity checks when workflow or environment files change.

# Summary

Workflow-only changes could pass quick verification without running the existing CI/environment parity test because that test reads files dynamically. Quick verification now explicitly checks those inputs, including committed branch changes, so missing CI flag documentation fails before publication.

# Changes

- Select the existing parity test for `.github/workflows/**` and `.env.example` changes, including staged, untracked, deleted and committed branch changes.
- Use the available local `origin/develop` merge base without fetching or mutating Git. When that ref exists but its history cannot be compared, run parity conservatively.
- Preserve ordinary source-related selection and the full-suite fallback before the first commit. Exclude parity from the related invocation only when the explicit parity step runs, avoiding duplicate execution.
- Add real temporary-Git command regressions and document the repeated-mistake lesson.

# Acceptance criteria and evidence

- Workflow-only regressions failed before implementation; working/staged/untracked/committed variants now invoke explicit parity.
- Environment-only changes invoke parity and propagate a failing child exit to quick verification.
- A temporary repository runs the actual unchanged CI parity test: an undocumented synthetic flag fails with its existing diagnostic, then passes after `.env.example` documents it.
- Source-only related arguments remain unchanged; explicit parity is selected once and excluded from the related step. Deleted/renamed-away workflows and missing/unrelated base history are covered.

# Verification

Focused command and existing parity tests **13/13 pass (7.98s)**. Quick lint/types/related tests pass. Full unchanged serial unit/coverage passes **1860 tests,197 conditional skips,183.74s**, with **98.33% critical lines /98.56% branches** at unchanged per-file thresholds. Independent source/regression review is clean. Final exact-head CI remains required before merge.

# Risks and rollout

No product, database, CI policy, hook or threshold change. Workflow/environment edits add one narrow test invocation. Committed-change detection uses locally available remote history; no network operation is added to quick verification. Removing this script change restores prior selection behavior, but loses early parity feedback.

# Screenshots

N/A: command-line harness behavior only; no rendered UI.

# UI checklist

N/A for screenshots, tokens, typography, mobile, motion, keyboard, contrast, images, performance, copy, shared components, sharing, QR output and staff feedback: no application/UI change. Verification results are recorded above.

# Harness changes, if any

Only quick test selection and command regressions. Existing parity assertions, lint, types, source tests, full verification and hooks remain intact. Tests isolate Git environment and use disposable directories; fake package-manager processes are confined to those fixtures.
