---
id: TICKET-218
title: Start tickets in one fast command with an on-demand database
epic: foundations
status: in_progress
priority: high
estimate: M
labels: [infra]
module: harness
owner: unclechenna
agent: claude
blocked_by: []
blocks: []
branch: TICKET-218
pr: ""
created: 2026-11-07
updated: 2026-11-07
started: 2026-11-07
completed: ""
reason: ""
resume_to: ""
---

# TICKET-218: Start tickets in one fast command with an on-demand database

## Context

The owner wants agents to pick up tickets faster (2026-11-07). On 2026-11-06 every new worktree failed to start its
database, for two reasons:

- A full Supabase stack per worktree overloads Docker.
- `wt:new` ran from a main checkout on an old branch, so it ran old harness code that didn't copy the auth template
  (TICKET-208).

Starting a ticket also took four commands. `t:next` hid tickets whose blockers were only waiting on review.

See: [Collaboration](../docs/collaboration.md) · [Tickets](../docs/tickets.md).

## Scope

1. **`pnpm t:start <id>`:** claims the ticket (moving it from `backlog` to `todo` first if needed), creates the
   worktree, installs dependencies, moves it to `in_progress` and pushes. `--ahead` passes through.
2. **On-demand database:** `wt:new` no longer starts Supabase unless `--db` is given. `db:migrate`, `db:seed` and
   `db:reset` start this worktree's stack first when it isn't running. `wt:new` still writes the stack config and
   copies the templates.
3. **Stale harness warning:** `t:*` and `wt:*` warn when the checkout running them is behind `origin/develop` on the
   harness files.
4. **More tickets on offer:** `t:next` also lists tickets that can start ahead (blockers in progress or in review),
   marked as such.

Builds on TICKET-217's branch (PR #108), which edits the same harness files; merge #108 first.

## Out of scope

- Replacing local Docker with Neon branches: TICKET-213.

## Acceptance criteria

- [ ] `t:start` performs claim, worktree, install and `in_progress` in one command (unit test of the plan and a dry run).
- [ ] `wt:new` without `--db` creates a worktree without starting Docker; with `--db` it starts the stack (test).
- [ ] `db:migrate` and `db:seed` start a stopped stack before running (test of the wrapper decision).
- [ ] A checkout behind `origin/develop` on harness files gets a warning from `t:*` and `wt:*` (unit test).
- [ ] `t:next` shows ahead-startable tickets after ready ones, labelled (unit test).
- [ ] AGENTS.md, `docs/collaboration.md`, `docs/tickets.md` and the ticket-workflow skill describe `t:start`.

## Test plan

- Unit: the `scripts/__tests__` harness tests.
- Gate: `pnpm verify` passes in CI.

## Files likely touched

- `scripts/tickets.ts`, `scripts/worktree.mjs`, `scripts/worktree.sh`, `scripts/db-local.mjs`, `package.json`
- `AGENTS.md`, `docs/collaboration.md`, `docs/tickets.md`, `.agents/skills/ticket-workflow/SKILL.md`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-11-07 — new → backlog — unclechenna
- 2026-11-07 — backlog → todo — unclechenna
- 2026-11-07 — todo → claimed — unclechenna (claude)
- 2026-11-07 — todo → in_progress — unclechenna (claude)
