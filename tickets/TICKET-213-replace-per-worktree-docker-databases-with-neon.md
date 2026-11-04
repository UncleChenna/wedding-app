---
id: TICKET-213
title: Replace per-worktree Docker databases with Neon branches
epic: foundations
status: todo
priority: high
estimate: M
labels: [infra, db, docs]
module: harness
owner: ""
agent: ""
blocked_by: []
blocks: []
branch: ""
pr: ""
created: 2026-11-04
updated: 2026-11-04
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-213: Replace per-worktree Docker databases with Neon branches

## Context

Every managed worktree starts its own local Supabase stack in Docker (ADR 0010). With several worktrees open, Docker's
VM runs out of memory, stacks fail health checks, and Postgres connections time out. Agents have repeatedly had to
remove worktrees or start trimmed stacks to run database tests. The owner doesn't want Docker. A Neon branch per
worktree gives each checkout its own isolated, instantly created Postgres without containers. Proposed in
[ADR 0023](../docs/decisions/0023-neon-worktree-databases.md).

## Scope

- `pnpm wt:new` creates a Neon branch of the development project for the worktree and writes its connection string to
  the worktree's ignored `.env.local`. `pnpm wt:remove` deletes that branch. `db:start`/`db:stop` become no-ops with a
  pointer to the new flow.
- `scripts/database-target.ts` stops requiring localhost. It accepts only the branch recorded in
  `.harness/worktree.json` for that worktree, and refuses the project's default and production branches, so tests and
  `db:reset` can never touch shared data.
- Admin sign-in tests use a hosted Supabase development project for Auth (email codes and TOTP), because Neon doesn't
  provide Auth.
- Update ADR 0010 (superseded), the `db-migration` skill, collaboration docs and handoff guidance that mention
  `db:start`.

## Out of scope

- The production database host (TICKET-144). This ticket is development and test only.
- CI, which already uses a plain `postgres:17` service.
- Board realtime (TICKET-033).

## Acceptance criteria

- [ ] With Docker stopped, a new worktree's `pnpm db:migrate`, `pnpm db:seed` and opt-in database tests pass against its own Neon branch.
- [ ] `pnpm wt:remove <id>` deletes that branch; a second worktree's branch is untouched.
- [ ] The database guard refuses the default branch, production URLs and other worktrees' branches (unit tests); `db:reset` still checks identity.
- [ ] No Neon API key or connection string is committed, printed or logged; keys come from the environment only.
- [ ] Admin auth e2e tests run against the hosted Supabase development project, or are documented as requiring it.
- [ ] ADR 0023 accepted by the owner; ADR 0010 marked superseded.

## Test plan

- Unit: guard decisions for allowed and refused targets; branch naming from the ticket id.
- Integration: create and remove two worktrees in parallel; run each one's database tests; confirm isolation.
- Manual: owner creates the Neon project and API key; one end-to-end run on a machine without Docker.

## Files likely touched

- `scripts/worktree.mjs`, `scripts/db-local.mjs`, `scripts/database-target.ts`, `scripts/harness/*`
- `docs/decisions/0010-worktree-databases.md`, `docs/decisions/0023-neon-worktree-databases.md`, `docs/collaboration.md`
- `.agents/skills/db-migration/SKILL.md`, `.env.example`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-04 — Created at the owner's request ("I don't want to use docker… I can make use of neon"). Needs from the
  owner before implementation: a Neon account and development project, an API key with branch create and delete rights
  in the shell environment, and a hosted Supabase development project for Auth. Harness work affects both agents:
  announce on the Codex side before landing.

## Activity log

- 2026-11-04 — new → todo — unclechenna
