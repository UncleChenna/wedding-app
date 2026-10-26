# Ticket

TICKET-007 — Prove ticket claims across two clones against GitHub.

# Summary

The compare-and-swap claim mechanism had only local-remote evidence. Two separate clones now raced the same ready, unowned ticket against the real GitHub ledger. Exactly one succeeded; the loser rejected the claim, observed the winner and skipped that ticket in the live queue.

# Changes

- Record real command outputs, timestamps, distinct clone identities and the fetched origin/ticket-ledger commit.
- Record cleanup: the temporary TICKET-005 claim was released by the winning identity, and a fresh read confirmed it is todo and unowned again.
- Add the reproducible plan and handoff; no product code or ledger algorithm changes.

# Acceptance criteria and evidence

All three criteria are demonstrated in docs/reviews/TICKET-007/README.md. Clone a returned exit 0; clone b returned an already-claimed error. The losing clone's board/show returned the winning owner and t:next --human returned another ticket. The remote ledger claim commit is recorded verbatim.

# Verification

The real two-clone rehearsal passed and restored the probe's ownership. Quick/full gates passed: 251 unit tests, 155 browser passes and 17 conditional skips, plus lint, types, formatting, ticket validation and production build. The PR workflow repeats full verification before publication. No UI changes, so screenshots are not applicable.

# Risks and rollout

The probe was a temporary metadata-only claim on TICKET-005; no CODEOWNERS, repository protection or feature changes were made. Claim/release audit history remains in the shared GitHub ledger. This models two developers with separate clones under one operator; it does not certify two-human ergonomics or database isolation. Local database startup was cancelled because this rehearsal does not require it. Revert the evidence commit if needed; no data migration or production rollback applies.

# Screenshots

N/A: documentation and CLI rehearsal only.

# UI checklist

N/A: no UI or styling changes.

# Harness changes, if any

None. Existing CLI, owner checks and compare-and-swap ledger were exercised unchanged. Merge after required CI passes under the user's explicit authorization to complete tickets sequentially.
