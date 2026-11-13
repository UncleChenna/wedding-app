# Ticket

Ticket: TICKET-233

# Summary

A ticket merged before its PR URL was recorded can remain stuck in progress: ordinary completion correctly requires review, while verified repair recovery previously required the missing URL. Add explicit `t:reconcile --original-pr <number>` for this historical case, retaining all existing completion evidence checks.

# Changes

- Accept an original repository PR number only in repair mode, for an owned blocked/in-progress ticket with an empty PR field and a recorded branch. Existing original links cannot be replaced.
- Verify the original PR is merged, not a fork, belongs to the repair repository, has the exact ticket-title prefix and recorded head branch, and contains the expected ticket definition at its tested head.
- Preserve the separate repair requirement, original/repair merge ancestry, fresh develop fetch, complete tested/current criteria, completed dependencies and exact-head full CI. Both PR identities are re-read before completion.
- Atomically store the verified original URL and completion only after all proof succeeds inside the ledger transaction. No historical worktree or collaborator identity is modified.
- Document the explicit recovery command and add real-Git CLI rejection fixtures.

# Acceptance criteria and evidence

- PASS: successful missing-link recovery in both blocked and in-progress lifecycle states records the verified original URL with done.
- PASS: wrong title/branch, fork or different repository, changing identity, existing link, malformed number, failed/pending CI, other owner, unfinished dependency, unchecked criteria and unmerged original leave the ledger unchanged.
- PASS: existing historical integration and repair fixtures retain their assertions; docs describe the option and its limits.

# Verification

- Initial15 new cases:3 failed,12 passed, proving missing support and an ignored explicit override before implementation.
- `pnpm exec vitest run scripts/__tests__/tickets.test.ts scripts/__tests__/ticket-reconcile.test.ts`:141 tests pass, including all15 new cases and all existing scenarios.
- `pnpm lint`: passes with zero warnings. `pnpm typecheck`: passes.
- `git diff --check`: passes. Independent source review found no blockers.
- `t:pr` runs the normal focused verification lane; full hosted CI remains mandatory before using this PR as repair provenance. No database/browser test is claimed locally for this CLI-only change.

# Planned historical reconciliation

TICKET-076 is owned by the receiving operator after the explicit coordinated ledger handoff and is blocked on this fix. Original PR140 is merged; approved manual tablet QA remains unchecked in TICKET-201 after PR174. Once this PR is merged with full CI, use original140 plus this verified repair PR, then close077, reconcile078/075 against verified repair164, and close133 in dependency order. Existing failed CI history remains recorded. A rejected proof leaves that ticket open; no status or PR metadata is edited by hand.

# Risks and rollout

No product, database, dependency, CI workflow or authorization-policy changes. The new option deliberately refuses forked/renamed-branch/retitled originals unless their metadata meets the explicit identity rules; it never relaxes proof because evidence is absent. A missing historical commit or failed fetch remains a hard failure. Revert the command change to remove the option; already recorded ledger activity remains auditable.

# Screenshots and UI checklist

N/A: CLI-only recovery and documentation, no rendered UI changes.

# Harness changes

One explicit historical recovery input, guarded by existing owner/lifecycle/CAS and complete immutable proof. No tests, hooks or checks are weakened.
