---
id: TICKET-006
title: Prove the managed worktree lifecycle end to end
epic: foundations
status: in_progress
priority: high
estimate: M
labels: [infra, test]
module: harness
owner: divine
agent: codex
blocked_by: [TICKET-001, TICKET-002, TICKET-003]
blocks: []
branch: TICKET-006
pr: ""
created: 2026-10-21
updated: 2026-10-26
started: 2026-10-26
completed: ""
reason: ""
resume_to: ""
---

# TICKET-006: Prove the managed worktree lifecycle end to end

## Context

Remainder of HARNESS-001: `wt:new` and `wt:remove` (isolated Supabase stacks and ports) have only been checked in isolation, never as a full lifecycle with tickets.

See: [Working together](../docs/collaboration.md) · [Current state](../docs/current-state.md).

## Scope

- Two worktrees for two claimed tickets at once, each with its own stack and ports.
- `pnpm dev` and Playwright inside each use the worktree's ports.
- `wt:remove` refuses dirty or unmerged work and then cleans up only its own stack.

## Out of scope

- New harness features.

## Acceptance criteria

- [ ] Two worktrees run `pnpm db:migrate` and `pnpm test:e2e:smoke` at the same time without port or data collisions.
- [ ] `wt:remove` on a dirty worktree fails; on a merged one it removes the checkout and stack.
- [ ] Steps and outputs are recorded in notes; any doc inaccuracy in collaboration.md is fixed.

## Test plan

- Manual: Scripted run on a developer machine with Docker.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `scripts/worktree.mjs`
- `docs/collaboration.md`

## Notes / decisions

- 2026-10-21: Migrated from `docs/tasks.json` HARNESS-001 (remaining verification).

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-26 — todo → claimed — divine (codex)
- 2026-10-26 — todo → in_progress — divine (codex)
