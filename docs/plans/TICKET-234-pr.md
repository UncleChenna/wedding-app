# Ticket

Ticket: TICKET-234

# Summary

Simultaneous ticket commands in linked worktrees could fail while fetching the shared ledger ref or immediately reject another active writer. Ledger reads now fetch the advertised immutable commit without changing shared fetch references, and writers wait briefly for their turn before applying the existing checks.

# Changes

- Fetch the exact advertised commit without writing `FETCH_HEAD`, tags or configured remote-tracking mappings.
- Wait up to 30 seconds using a monotonic deadline for the existing clone-wide writer lock. Preserve unowned locks on timeout; reject unexpected filesystem errors.
- Keep fresh-state reads, ownership/lifecycle callbacks and remote compare-and-swap retries unchanged.
- Document retry behavior and add real temporary Git repository/linked-worktree regressions.

# Acceptance criteria and evidence

- Concurrent origin reads preserve sentinel `FETCH_HEAD` and an intentionally distinct tracking ref.
- Two simultaneous linked-worktree writers both succeed and preserve both increments.
- A held lock times out without deleting its owner marker; a file at the lock path fails immediately and remains intact.
- A rejected update publishes no changes and releases only its own lock. Unavailable origin fails closed.

# Verification

- Initial regressions reproduced the exact Git expected-old ref collision and immediate writer rejection.
- Five focused real-Git regressions pass.
- Existing ticket suite plus the initial three concurrency regressions: 129 passing (141 seconds).
- `pnpm verify:quick`: lint, typecheck and 27 related tests pass.
- No product build, database or physical-device run needed for this command-line change.

# Risks and rollout

No schema, production service or guest behavior changes. Use this checkout's ticket tools after merge; older worktrees retain the old implementation. A writer lasting more than 30 seconds still causes a safe timeout requiring retry. Crashed locks are never automatically removed. Existing remote lease retry limits remain unchanged. Reverting this ticket restores the previous CLI behavior without data migration.

# Screenshots

Not applicable: command-line coordination only.

# UI checklist

Not applicable: no UI, rendering, theme, interaction or guest copy changes.

# Harness changes, if any

This changes only ledger transport and local writer scheduling. It does not relax ownership, completion, verification, PR identity or merge requirements. Parent review is requested before publication.
