---
id: WED-154
title: Release to production and confirm the site installs as a PWA
epic: deployment
status: todo
priority: urgent
estimate: M
labels: [infra, pwa, test]
module: ops
owner: ""
agent: ""
blocked_by: [WED-044, WED-050, WED-066, WED-078, WED-091, WED-096, WED-113, WED-123, WED-124, WED-126, WED-140, WED-146, WED-148, WED-153]
blocks: [WED-114, WED-138, WED-142, WED-157, WED-162]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-154: Release to production and confirm the site installs as a PWA

## Context

Milestone: the full app is deployed on the real domain and installable as a PWA, ready for real data and sharing.

See: [Milestones, scope and testing](../docs/prd.md#milestones-scope-and-testing) · [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture).

## Scope

- Promote a verified release; run production smoke; Lighthouse installability on production; tag the release.

## Out of scope

- Real guest data (WED-157).

## Acceptance criteria

- [ ] Production smoke passes on the domain.
- [ ] Lighthouse reports the site installable on production.
- [ ] Release tag and changelog exist.

## Test plan

- End-to-end: Production smoke.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/deployment.md`
- `CHANGELOG.md`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
