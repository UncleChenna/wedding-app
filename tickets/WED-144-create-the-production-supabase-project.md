---
id: WED-144
title: Create the production Supabase project
epic: deployment
status: todo
priority: urgent
estimate: S
labels: [human, infra]
module: ops
owner: ""
agent: ""
blocked_by: [WED-145]
blocks: [WED-028, WED-148, WED-149, WED-151]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-144: Create the production Supabase project

## Context

Production needs its own Supabase project (region close to the UK) with access for both developers.

See: [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture).

## Scope

- Create project in eu-west-2 or nearest; enable PITR/backups per plan; invite both developers.
- Record plan and cost decision.

## Out of scope

- Migrations (WED-150).

## Acceptance criteria

- [ ] Project exists; region and plan recorded in docs/deployment.md.
- [ ] Connection secrets only in Vercel env.

## Test plan

- Manual: Account setup.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/deployment.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
