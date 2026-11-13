---
id: TICKET-243
title: Bound shared-ledger Git writes and avoid stalled standard-input pipes
epic: foundations
status: in_progress
priority: high
estimate: S
labels: [infra, test]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-243
pr: ""
created: 2026-11-13
updated: 2026-11-13
started: 2026-11-13
completed: ""
reason: ""
resume_to: ""
---

# TICKET-243: Bound shared-ledger Git writes and avoid stalled standard-input pipes

## Context

Workflow contract: [shared ticket ledger](../docs/tickets.md) and [collaboration](../docs/collaboration.md).

Owned ticket publication repeatedly stalled for minutes in `git hash-object -w --stdin`, holding the shared ticket ledger lock even after verification completed. TICKET-241 recovered only after its confirmed owned child was terminated and the normal ledger retry succeeded. The workflow must bound this wait without bypassing checks or changing ticket ownership rules.

## Scope

- Replace ledger blob standard-input piping with a private temporary file passed to Git.
- Bound pre-publication Git object/index preparation (not ref publication) and clean up this attempt's temporary files on success, failure and timeout.
- Preserve immutable snapshots, local-worktree serialization, remote compare-and-swap, retries and normal commit hooks.
- Document the bounded failure/retry behavior and show useful errors without echoing ledger payloads.

## Out of scope

- Timing out ref updates/pushes after an ambiguous acknowledgement, removing another process's lock, killing unrelated processes, disabling checks, changing ledger fields or weakening remote lease protection.

## Acceptance criteria

- [x] Ledger blob creation passes a private file to Git and does not depend on a standard-input pipe; the serialized JSON remains unchanged.
- [x] A simulated stalled or failed owned preparation subprocess terminates within its configured bound, removes only its temporary workspace and releases its acquired ledger lock.
- [x] A failed publication does not alter the authoritative ledger; a subsequent normal retry can publish successfully.
- [x] Concurrent linked-worktree writers still retain both updates and a stale remote lease cannot overwrite another writer.
- [x] Existing ownership, validation and verification hooks remain enabled, with focused real-Git regressions passing.

## Test plan

- Unit: bounded command options, private temporary input and cleanup paths.
- Integration: isolated real Git repositories and linked worktrees; synthetic child failure/timeout and successful recovery; existing ledger concurrency suite.
- Gate: normal verify:quick through the commit/PR workflow, with no bypass variables.

## Files likely touched

- `scripts/tickets/git.ts`
- `scripts/__tests__/ledger-concurrency.test.ts`
- `scripts/__tests__/ledger-write.test.ts`
- `docs/learnings.md`

## Notes / decisions

2026-11-13: Preparation timeouts intentionally exclude ref updates and remote push, preserving acknowledgement/retry semantics. Authorized focused harness repair after observed repeated publication stalls; implementation stays on its own branch, separate from TICKET-241.

## Activity log

- 2026-11-13 — new → backlog — divine (codex)
- 2026-11-13 — backlog → todo — divine (codex)
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
