---
id: WED-148
title: Define and validate environment variables per environment
epic: deployment
status: todo
priority: urgent
estimate: M
labels: [infra, security]
module: shared
owner: ""
agent: ""
blocked_by: [WED-125, WED-144, WED-147]
blocks: [WED-150, WED-154, WED-176]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-148: Define and validate environment variables per environment

## Context

Preview and production need different databases, keys and site URLs, validated at boot.

See: [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture).

## Scope

- Table of every variable per environment in docs/deployment.md; set in Vercel; env schema validates at boot.

## Out of scope

- Secret rotation (WED-125).

## Acceptance criteria

- [ ] A missing variable fails the deploy with a clear message (tested via env schema).
- [ ] Docs table matches `.env.example` (test).

## Test plan

- Unit: Env parity test.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/deployment.md`
- `.env.example`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
