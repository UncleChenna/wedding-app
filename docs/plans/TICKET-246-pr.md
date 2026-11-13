# Ticket

Ticket: TICKET-246

# Summary

A collaborator merging a reserved ticket could make an older, otherwise intact branch fail validation because the validator compared against the moving `origin/develop` tip. Reservation exemptions now use the branch's common baseline with develop, so later merges do not force unrelated ticket definitions into the branch.

# Changes

- Resolve a single Git merge-base before collecting committed baseline ticket IDs.
- Keep baseline ticket IDs mandatory and shared-ledger reservations authoritative.
- Fall back to strict missing-ID validation when ledger/history/tree information is unavailable or merge bases are ambiguous.
- Preserve ownership, statuses, graph checks, IDs and publication behavior.

# Acceptance criteria and evidence

Four focused real-Git regressions pass. The moving-develop and missing-baseline cases failed before the implementation change. Tests reserve tickets in separate clones, advance develop, confirm the older branch still validates, and confirm deletion of an original ticket fails. Missing refs, unrelated history and disabled ledger also retain strict validation.

# Verification

Focused CLI regression run: four passed in 7.00s. Normal hooks and independent review are recorded below once complete. No application, database or browser behavior changes.

# Risks and rollout

Shallow or unrelated histories cannot establish a trusted baseline and remain strict. Fetch the required history to recover; validation is never bypassed. Existing branches receive the behavior only after integrating this change or using current tooling. Reverting restores the previous moving-tip behavior; no data migration is involved.

# Screenshots

N/A: command-line validation only.

# UI checklist

N/A: no UI changes.
