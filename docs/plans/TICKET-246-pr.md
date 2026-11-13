# Ticket

Ticket: TICKET-246

# Summary

A collaborator merging a reserved ticket could make an older, otherwise intact branch fail validation because the validator compared against the moving `origin/develop` tip. Reservation exemptions now use the branch's common baseline with develop, so later merges do not force unrelated ticket definitions into the branch.

# Changes

- Resolve a single Git merge-base before collecting committed baseline ticket IDs.
- Keep baseline ticket IDs mandatory and shared-ledger reservations authoritative.
- Fall back to strict missing-ID validation when ledger/history/tree information is unavailable or merge bases are ambiguous.
- Preserve ownership, statuses, graph checks, IDs and publication behavior.
- Fetch complete history in the ticket-validation CI job, matching the history already available in planning and general verification.

# Acceptance criteria and evidence

Four focused real-Git regressions pass. The moving-develop and missing-baseline cases failed before the implementation change. Tests reserve tickets in separate clones, advance develop, confirm the older branch still validates, and confirm deletion of an original ticket fails. Missing refs, unrelated history and disabled ledger also retain strict validation.

# Verification

Focused CLI regression run: four passed in 7.00s. Normal commit lint, TypeScript and related ticket tests pass. Independent source and regression review found no blocker. No application, database or browser behavior changes.

# Risks and rollout

Shallow or unrelated histories cannot establish a trusted baseline and remain strict. The CI ticket job now fetches full history; local shallow checkouts must fetch the required history to recover. Validation is never bypassed. Existing branches receive the behavior only after integrating this change or using current tooling. Reverting restores the previous moving-tip behavior; no data migration is involved.

# Screenshots

N/A: command-line validation only.

# UI checklist

N/A: no UI changes.

## Hosted checkout repair

The initial hosted ticket job failed because actions/checkout used depth 1 for the synthetic PR merge; the validator correctly refused to infer a baseline from incomplete history. Job `131849096180` reported reserved holes as missing. Only the ticket job checkout depth changes to 0; no validation or deletion safeguard is relaxed.

A new real-Git test fetches a synthetic PR merge at depth 1, proves reserved-gap validation fails closed, fetches complete history and proves validation succeeds, then deletes baseline TICKET-001 and proves rejection remains. The CI configuration assertion failed before the repair and passes afterward. Six focused cases pass in 8.35 seconds (the other 129 cases were not selected in this run). Independent review of the narrow CI change and synthetic-merge regression is clean; normal commit checks remain required before publication.
