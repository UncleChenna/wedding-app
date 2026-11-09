# Ticket

Ticket: TICKET-224

# Summary

Historical ticket PRs merged through intermediate branches cannot use the current
develop-only completion path. Add an explicit historical recovery command that
requires actual merge ancestry, complete criteria and successful immutable CI.
The real TICKET-186/#4 and TICKET-187/#5 audit correctly refuses: their original
merges are absent from develop history. Their statuses remain unchanged, with
provenance research tracked in newly allocated TICKET-225.

# Changes

- Add `t:reconcile <id> --integration-pr <number> --reason ...` for owned in-review
  historical stacks. Normal direct completion and repair mode remain separate.
- Require original head/merge ancestry through a tested develop integration,
  completed original criteria at all three checked revisions, and live shared ledger.
- Check original four-job historical CI plus integration five-job baseline; every
  returned job must succeed. Re-read heads, run identity and status to reject races.
- Record original head/merge/base/CI and integration merge/head/CI/develop in ledger
  activity without replacing the original PR or modifying historical worktrees.
- Document strict refusal and create TICKET-225 rather than inventing provenance.

# Acceptance criteria and evidence

- Real temporary Git repositories exercise success and refusal through the CLI.
- Refusal scenarios cover ownership, dependencies, missing ancestry/criteria,
  wrong bases/repositories, open PRs, missing/stale/failed/pending/restarted CI,
  changed heads and unavailable shared ledger. Local ticket files remain unchanged.
- Successful fixture recovery preserves original PR identity and complete proof in
  the shared ledger. Existing direct workflow and repair tests remain covered.
- [Actual historical audit](../reviews/TICKET-224/historical-evidence.md) records
  deliberate refusal for #4/#5; their closure is not claimed or required for this
  strictly scoped tooling delivery. TICKET-225 owns unresolved provenance.

# Verification

- New historical success regression initially failed against the existing CLI.
- Initial complete workflow/reconciliation suites:105 passed; reinforced focused suite:36 passed.
- Final `pnpm verify:quick`: lint/types and107 related tests passed (94.26s tests),
  including distinct no-ff historical merges and mixed-mode refusal.
- `pnpm t:validate`:222 tickets valid; `pnpm t:render` refreshed ignored artifacts.
- Independent final source review found no blocking issue.
- Read-only real Git/GitHub audit: original CI successful, original merge ancestry
  missing; verifier refuses without status mutation.
- Full required CI remains pending on the final pushed head.

# Risks and rollout

CLI-only change; no database migration, product code, paid service or production
operation. Recovery is intentionally conservative: squash/rewrite histories,
missing checks and skipped jobs refuse. A successful recovery writes the shared
ledger only; original ticket files catch up through normal owned-branch workflow.
Revert this tooling change to remove the additional command mode. No actual
historical statuses have been changed by this PR.

# Screenshots

N/A: no frontend or theme changes.

# UI checklist

N/A: this is ticket tooling, documentation and tests. No UI/device/performance
checks are claimed. Required CI runs the full verification suite.

# Harness changes, if any

Explicit historical mode complements existing repair reconciliation; no force
option, hook bypass, weakened test or ownership exception is introduced.
