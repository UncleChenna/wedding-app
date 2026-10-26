# Ticket

TICKET-203 — Verify historical stacked PR ancestry before closing tickets.

# Summary

The completion guard rejected all historical stacked PRs and could use local acceptance criteria when fetching develop failed. It now requires fresh Git ancestry evidence and reads criteria from the same fetched develop commit.

# Changes

- Fetch develop and resolve its exact commit before validating merged PR ancestry.
- Permit historical stacked PRs only when their merge commit is reachable; reject missing history, missing ticket content or failed fetch.
- Preserve owner/lifecycle checks and develop targeting for new PRs; improve completion refusal text.
- Restore the already allocated unused ID 202 definition and cancel it through the CLI ledger, repairing the contiguous-ID validation prerequisite. Allocator changes remain TICKET-194.

# Acceptance criteria and evidence

Seven Git-backed regression cases cover successful stacked/direct completion evidence, open/closed PRs, unreachable or missing commits, missing metadata/ticket content and failed fetch with cached ancestry. Existing owner/criteria/workflow tests still pass.

Actual PR #4/#5 merge commits are NOT reachable from inspected develop `fa36b00`. Both CLI closure attempts were correctly rejected; TICKET-186/187 remain open. Their checked boxes alone are insufficient. Exact hashes and commands are recorded in `docs/handoffs/TICKET-203.md`.

# Verification

Draft: the results below precede rebasing onto the typography merge. Final integration verification is pending; this PR is not ready to merge yet.

Quick/full gates passed: 258 unit tests, production build, 155 browser passes and 17 conditional skips. Focused regression plus existing ticket tests: 31 passed, including a rerun after the diagnostic update. Ticket validation: 203 definitions valid.

# Risks and rollout

Completion now requires network access and adequate Git history; unavailable or shallow ancestry fails closed. No databases, CI configuration or product UI changes. No history rewrite. Revert the helper and CLI integration to roll back, retaining the allocation record so IDs stay contiguous.

# Screenshots and UI checklist

Not applicable: ticket CLI and documentation only. No UI or styling changes.

# Harness changes

The evidence helper is used by the done transition. Reads do not synchronize another branch's ticket file; ledger status remains authoritative.
