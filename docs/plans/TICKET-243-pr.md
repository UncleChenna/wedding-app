# Ticket

TICKET-243

# Summary

Ticket publication could stall for minutes in Git's standard-input blob reader while holding the shared ledger lock. Preparation now uses a private file and bounded owned subprocesses, while preserving the existing remote lease and retry behavior.

# Changes

- Write the same ledger JSON to a mode-0600 file inside a mode-0700 temporary workspace; hash raw bytes with `--no-filters`.
- Ignore stdin for hash, index, tree and commit preparation. Each command has a 30-second default timeout, with only smaller positive integer budgets permitted.
- Kill only the timed-out owned preparation child and remove its workspace in `finally`. Ref publication, remote push, locking, ownership validation and three-attempt retry are unchanged.
- Add real-Git preparation regressions and an explicit stale remote lease check.

# Acceptance criteria and evidence

Private-file mode, unchanged parsed JSON, raw hashing, ignored stdin and successful cleanup are asserted. Synthetic failure and a child ignoring SIGTERM both leave the ledger unchanged, remove owned temporary files and release the acquired lock; a later normal mutation succeeds. Concurrent linked worktrees retain both increments; a stale lease cannot overwrite a newer remote ledger. Existing lock-owner and unavailable-origin tests remain.

# Verification

The initial private-file test failed against the original `hash-object --stdin` implementation as expected. Final focused real-Git suites pass 10 tests. Normal commit/PR verification runs without bypass flags; required hosted CI remains the merge gate. Independent source review found no blocking issue.

# Risks and rollout

This bounds each preparation command, not the entire transaction or network push. An unusually slow preparation command can now fail after three attempts rather than wait indefinitely; retry the ticket command after resolving host load. Unreferenced Git objects may remain after failure and are handled by normal Git garbage collection. No database migration, dependency, secret, CI or guest UI change. Rollback restores the previous preparation implementation without changing ledger format.

# Screenshots and UI checklist

Not applicable: command-line ledger internals only. No product interface changed.

# Harness changes

The repeated publication stall is covered by executable failure/timeout/recovery regressions and documented in `docs/learnings.md`. Normal repository hooks remain enabled.
