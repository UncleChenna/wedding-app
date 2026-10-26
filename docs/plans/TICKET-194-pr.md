# Ticket

TICKET-194 — Validate new-ticket input before allocating an ID.

# Summary

Invalid ticket creation requests consumed IDs before failing, leaving gaps that broke backlog validation. New requests now validate their provisional definition and owner before reserving the next ID.

# Changes

Move normal parser validation before ledger mutation; restrict new tickets to backlog/todo and direct later transitions through t:move. Preserve atomic allocation and never reuse reserved IDs.

# Acceptance criteria and evidence

Four real-Git regressions cover invalid estimate, priority, status and missing owner. Rejections preserve the ledger head and lastId, errors list valid enum values, and the next valid request gets the expected ID. All 28 ticket tests pass; all four new cases failed before the fix.

# Verification

Integrated quick/full gates passed: 270 unit tests, production build, 157 first-attempt browser passes, six retry passes and 17 conditional skips. All six affected browser cases passed with one worker and no retries in 47.1 seconds. Initial full gate had 262 unit passes and one pre-existing worktree-base timeout; its isolated rerun passed in 2.92 seconds without changing the 5-second limit. Required CI must still pass before merge.

# Risks and rollout

No database migrations, dependencies or CI changes. A filesystem failure after a successful allocation is still outside this validation fix. Historical reserved IDs stay reserved. Reverting restores the prior input-validation timing.

# Screenshots and UI checklist

Not applicable: ticket CLI and tests only; no rendered UI changed.

# Harness changes

Ticket creation validates before allocating. Existing compare-and-swap and ownership behavior remains.
