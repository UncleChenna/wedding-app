# Ticket

Ticket: TICKET-230

# Summary

Coordinated ownership changes currently require pretending to be the previous collaborator or editing the shared ledger manually. The new handoff command records the real recipient and an explicit coordination reason while preserving the ticket's status and verification requirements.

# Changes

- Add `pnpm t:handoff <id> --from <owner> --agent <agent> --coordinated --reason <authorization>`.
- Recheck the expected previous owner inside the shared-ledger mutation, including optimistic concurrency retries.
- Change only owner, agent and update date. Preserve branch, PR, status, blockers and evidence.
- Reject offline operation, missing acknowledgement/reason, stale ownership, unclaimed/terminal tickets and identity omissions.
- Document active-editor coordination and preservation of uncommitted work. The flag is an operator acknowledgement, not an automatic authorization or editor-presence detector.

# Acceptance criteria and evidence

Focused red-to-green unit and real-Git tests prove the transition preserves lifecycle metadata, logs both identities, preserves another clone's notes and rejects stale retries without advancing the ledger. Existing ownership guards remain unchanged. Independent review found no remaining blocker.

# Verification

- Focused handoff tests: 2 passed after reproducing both failures before implementation.
- Quick verification: lint, types and all 125 related ticket/harness tests passed (208.28 seconds).
- A separate duplicate full ticket-test invocation was interrupted to avoid running the same suite twice; it is not counted as passing evidence.
- Hosted checks remain required before merge.

# Risks and rollout

No product, database, dependency or CI policy change. Operators must have actual authorization and coordinate with any active editor before using the command. The CLI records that acknowledgement; it cannot detect another human's editor. Roll back by reverting this change; existing ticket operations retain their prior ownership protections.

# Screenshots

Not applicable: command-line collaboration tooling only.

# UI checklist

Not applicable: no product interface changed.

# Harness changes, if any

Adds one explicit ledger mutation with existing atomic write/retry behavior. Does not bypass tests, completion requirements, hooks or branch protection.
