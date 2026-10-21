---
id: WED-147
title: Configure Vercel builds and preview deployments per PR
epic: deployment
status: todo
priority: high
estimate: M
labels: [infra]
module: shared
owner: ""
agent: ""
blocked_by: [WED-004, WED-145]
blocks: [WED-148, WED-149]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-147: Configure Vercel builds and preview deployments per PR

## Context

Every PR should get a preview URL that reviewers and phones can open.

See: [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture).

## Scope

- vercel.ts config (build, crons, headers if needed); Node 24; preview comments on PRs.

## Out of scope

- Production promotion (WED-154).

## Acceptance criteria

- [ ] A PR gets a working preview URL automatically.
- [ ] Build uses the same pnpm version and lockfile as CI.

## Test plan

- Manual: Preview check.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `vercel.ts`
- `docs/deployment.md`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
