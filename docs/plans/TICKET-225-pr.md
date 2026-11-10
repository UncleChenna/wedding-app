# Ticket

Ticket: TICKET-225

# Summary

Historical PRs #4 and #5 merged into intermediate branches. Their original merge
objects are absent from develop, but their exact implementations and tested source
survive through PR #6. Add an explicit exact-source proof mode instead of treating
similar patches as sufficient evidence or replacing the original PR identity.

# Changes

- Audit every original TICKET-186/TICKET-187 criterion and retained Git objects in
  `docs/reviews/TICKET-225/provenance.md`.
- Permit `--source-commit <full-oid>` only with historical `--integration-pr`.
  Require a commit ancestor of the original tested head, identical whole-tree
  object, and ancestry into the tested integration and freshly fetched develop.
- Preserve original ownership, dependency, completed-criteria, PR metadata and
  repeated exact-head CI checks. Activity retains original PR/head/merge and adds
  source/tree while explicitly declining to assert missing merge ancestry.
- Add real Git refusal cases for changed files, identical-tree siblings,
  unreachable source, abbreviated IDs, non-commit objects, wrong mode, changed PR
  evidence, incomplete criteria, failed CI and wrong owner.

# Acceptance criteria and evidence

- Original criteria map to current code, tests and documentation in the audit.
- Explicit source proof retains all prior recovery checks and refuses partial or
  unrelated history. Positive regression failed before implementation.
- Neither historical ticket status nor its old worktree has been changed. Actual
  closure waits for independent review and this PR's verified merge, then CLI proof.

# Verification

- Baseline current prefix/coordination suite: 100 passed in 96.07s.
- Initial new exact-source regression: failed before implementation; eight source
  scenarios then passed in 11.48s, with 97 tests filtered by the focused selector.
- Final `pnpm verify:quick`: lint/types and 119 related tests passed (127.38s),
  including additional full-ID/type/mode refusals and retained-tested-head success.
- Read-only real evidence helper passed both originals against verified PR148;
  original CI runs, metadata and criteria reread. No ledger mutation occurred.
- Full hosted CI on the final PR head: pending.
- No database or browser tests required for this harness-only change.

# Risks and rollout

This is an opt-in historical recovery mode. Whole-tree equality alone is not
enough: source ancestry and both CI histories remain mandatory. Git/GitHub
availability is required and missing evidence fails closed. The audit does not
claim the original merges reached develop. No database migration or deployment
is needed. Reverting this change removes only the explicit source mode; it cannot
undo any later ledger completion, whose full evidence remains in activity history.

# Screenshots

N/A: no product UI changes.

# UI checklist

N/A: this changes ticket tooling and documentation only. No device, visual,
performance or accessibility verification is claimed.

# Harness changes, if any

Extends historical reconciliation with explicit exact Git source proof; ordinary
repair and completion paths remain unchanged. Historical PR metadata and dirty
worktrees are preserved.
