---
id: WED-149
title: Decide and set up the database for previews and staging
epic: deployment
status: todo
priority: urgent
estimate: M
labels: [human, infra]
module: shared
owner: ""
agent: ""
blocked_by: [WED-144, WED-147]
blocks: [WED-114, WED-124, WED-137, WED-138, WED-150, WED-151]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-149: Decide and set up the database for previews and staging

## Context

Preview deployments must never touch production data; the load test needs a staging stack.

See: [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture).

## Scope

- ADR: Supabase branching vs a separate staging project; seed with the load profile.

## Out of scope

- Production.

## Acceptance criteria

- [ ] Preview deploys use the staging database (verified by a settings marker).
- [ ] ADR merged.

## Test plan

- Manual: Preview check.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/decisions/`
- `docs/deployment.md`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
