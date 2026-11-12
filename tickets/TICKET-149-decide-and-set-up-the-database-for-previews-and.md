---
id: TICKET-149
title: Decide and set up the database for previews and staging
epic: deployment
status: todo
priority: urgent
estimate: L
labels: [human, infra]
module: shared
owner: ""
agent: ""
blocked_by: [TICKET-145]
blocks: [TICKET-114, TICKET-129, TICKET-137, TICKET-150, TICKET-151]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-149: Decide and set up the database for previews and staging

## Context

Preview deployments must never touch production data; the load test needs a staging stack.

See: [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture).

## Scope

- ADR: Supabase branching vs a separate staging project; seed with the load profile.
- Merged from TICKET-213 (Replace per-worktree Docker databases with Neon branches):
  - `pnpm wt:new` creates a Neon branch of the development project for the worktree and writes its connection string to
  - `scripts/database-target.ts` stops requiring localhost. It accepts only the branch recorded in
  - Admin sign-in tests use a hosted Supabase development project for Auth (email codes and TOTP), because Neon doesn't
  - Update ADR 0010 (superseded), the `db-migration` skill, collaboration docs and handoff guidance that mention

## Out of scope

- Production.

## Acceptance criteria

- [ ] Preview deploys use the staging database (verified by a settings marker).
- [ ] ADR merged.
- [ ] (from TICKET-213) With Docker stopped, a new worktree's `pnpm db:migrate`, `pnpm db:seed` and opt-in database tests pass against its own Neon branch.
- [ ] (from TICKET-213) `pnpm wt:remove <id>` deletes that branch; a second worktree's branch is untouched.
- [ ] (from TICKET-213) The database guard refuses the default branch, production URLs and other worktrees' branches (unit tests); `db:reset` still checks identity.
- [ ] (from TICKET-213) No Neon API key or connection string is committed, printed or logged; keys come from the environment only.
- [ ] (from TICKET-213) Admin auth e2e tests run against the hosted Supabase development project, or are documented as requiring it.
- [ ] (from TICKET-213) ADR 0023 accepted by the owner; ADR 0010 marked superseded.

## Test plan

- Manual: Preview check.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).
- (TICKET-213) Unit: guard decisions for allowed and refused targets; branch naming from the ticket id.
- (TICKET-213) Integration: create and remove two worktrees in parallel; run each one's database tests; confirm isolation.
- (TICKET-213) Manual: owner creates the Neon project and API key; one end-to-end run on a machine without Docker.

## Files likely touched

- `docs/decisions/`
- `docs/deployment.md`

## Notes / decisions

_Agents append dated notes here while working._
- 2026-11-12 (unclechenna, claude): TICKET-228 merged TICKET-213 into this ticket (all unstarted) to cut per-ticket overhead. Their scope, criteria and dependencies are above; the merged tickets are cancelled.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
