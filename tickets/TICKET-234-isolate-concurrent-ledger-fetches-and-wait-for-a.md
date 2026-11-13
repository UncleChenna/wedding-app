---
id: TICKET-234
title: Isolate concurrent ledger fetches and wait for active ticket writers
epic: quality
status: in_progress
priority: high
estimate: S
labels: [infra, test]
module: shared
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-234
pr: ""
created: 2026-11-13
updated: 2026-11-13
started: 2026-11-13
completed: ""
reason: ""
resume_to: ""
---

# TICKET-234: Isolate concurrent ledger fetches and wait for active ticket writers

## Context

Concurrent ticket commands in linked worktrees currently overwrite the same remote-tracking ref and immediately reject an active local writer. This interrupts otherwise valid publication and closure. Preserve the ownership and compare-and-swap guarantees in [ticket collaboration](../docs/tickets.md).

## Scope

- Read the advertised immutable ledger commit without updating shared fetch references.
- Wait for an active local writer for a bounded duration, preserving its lock on timeout.
- Add regression coverage for concurrent readers/writers and failed acquisition.

## Out of scope

- Changing ownership, lifecycle, verification requirements or remote lease checks.
- Removing another process's locks or changing collaborator worktrees.

## Acceptance criteria

- [ ] Origin reads return the advertised ledger snapshot without changing shared remote-tracking references or FETCH_HEAD.
- [ ] Concurrent commands can read and serialize writes without losing ledger updates.
- [ ] Lock contention waits for a bounded duration; timeout and non-contention errors fail without removing an unowned lock.
- [ ] Existing compare-and-swap, ownership and lifecycle checks remain enforced.

## Test plan

- Real temporary Git repositories and linked worktrees exercise reads, concurrent writes and lock ownership.
- Focused ticket tests and quick verification; required hosted checks before merge.

## Files likely touched

- `scripts/tickets/git.ts`
- `scripts/__tests__/ledger-concurrency.test.ts`
- `docs/tickets.md`

## Notes / decisions

- 2026-11-13 — Scoped after observed simultaneous ticket CLI failures; no collaborator worktree or lock deletion is authorized by this repair.

## Activity log

- 2026-11-13 — new → todo — divine (codex)
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
