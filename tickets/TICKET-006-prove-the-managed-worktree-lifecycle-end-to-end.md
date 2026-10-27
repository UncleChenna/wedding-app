---
id: TICKET-006
title: Prove the managed worktree lifecycle end to end
epic: foundations
status: blocked
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
updated: 2026-10-27
started: 2026-10-26
completed: ""
reason: "TICKET-205: failed control startup left DATABASE_URL on primary port54322 instead of reserved39281. Browser concurrency passed, but isolated migrations and cleanup remain unproved; target guard required before retry."
resume_to: in_progress
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

- 2026-10-26: Rehearsal blocked by unhealthy local Postgres startup (no response; health checks timed out). Build passed; concurrent database/browser and cleanup criteria remain unverified. See docs/reviews/TICKET-006/README.md and handoff for resume steps.

- 2026-10-21: Migrated from `docs/tasks.json` HARNESS-001 (remaining verification).

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-26 — todo → claimed — divine (codex)
- 2026-10-26 — todo → in_progress — divine (codex)
- 2026-10-26 — in_progress → blocked — divine (codex) — Local Docker database unhealthy: no response and health-check timeouts; concurrent migration/smoke and successful cleanup unverified.
- 2026-10-26 — Recovery attempt still blocked: managed setup exited 1 after service health failures; control DB unhealthy. No concurrent migrations/smoke or cleanup success claimed. Evidence appended to docs/reviews/TICKET-006/README.md; PR #34 stays draft.
- 2026-10-27 — blocked → in_progress — divine (codex) — Isolated stack recovered; startup and existing migrations passed on 2026-10-27. Resuming concurrent lifecycle proof.
- 2026-10-27 — in_progress → blocked — divine (codex) — TICKET-205: failed control startup left DATABASE_URL on primary port54322 instead of reserved39281. Browser concurrency passed, but isolated migrations and cleanup remain unproved; target guard required before retry.
