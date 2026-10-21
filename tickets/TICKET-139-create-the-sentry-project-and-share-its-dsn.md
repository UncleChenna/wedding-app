---
id: TICKET-139
title: Create the Sentry project and share its DSN
epic: observability
status: todo
priority: urgent
estimate: S
labels: [human, infra]
module: ops
owner: ""
agent: ""
blocked_by: [TICKET-145]
blocks: [TICKET-140]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-139: Create the Sentry project and share its DSN

## Context

Errors must be visible live on the day; Sentry needs an account (free tier).

See: [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture).

## Scope

- Create org/project; add DSN and auth token to Vercel env; invite both developers.

## Out of scope

- Code (TICKET-140).

## Acceptance criteria

- [ ] DSN present in Vercel env for preview and production (screenshot of names only).

## Test plan

- Manual: Account setup.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/deployment.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
