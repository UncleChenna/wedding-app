---
id: TICKET-145
title: Create the Vercel project and connect the repository
epic: deployment
status: todo
priority: urgent
estimate: S
labels: [human, infra]
module: ops
owner: ""
agent: ""
blocked_by: []
blocks: [TICKET-139, TICKET-144, TICKET-146, TICKET-147]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-145: Create the Vercel project and connect the repository

## Context

Hosting needs an account decision (Hobby vs Pro) and GitHub integration.

See: [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture).

## Scope

- Create project linked to UncleChenna/wedding-app; add both developers; choose plan.

## Out of scope

- Build config (TICKET-147).

## Acceptance criteria

- [ ] Project exists and a preview deploy runs for a PR (link in notes).

## Test plan

- Manual: Account setup.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/deployment.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
