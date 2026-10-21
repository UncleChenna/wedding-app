---
id: WED-154
title: Release to production and confirm the site installs as a PWA
epic: deployment
status: todo
priority: high
estimate: M
labels: [infra, pwa, test]
module: ops
owner: ""
agent: ""
blocked_by: [WED-044, WED-050, WED-067, WED-068, WED-079, WED-080, WED-081, WED-085, WED-087, WED-092, WED-093, WED-094, WED-097, WED-100, WED-101, WED-114, WED-116, WED-117, WED-118, WED-119, WED-120, WED-121, WED-124, WED-126, WED-127, WED-129, WED-130, WED-131, WED-132, WED-133, WED-134, WED-135, WED-136, WED-137, WED-138, WED-140, WED-146, WED-148, WED-153, WED-166, WED-174, WED-180, WED-012, WED-038, WED-176]
blocks: [WED-157, WED-162, WED-164]
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

Full wedding-day app release after the earlier invitation release WED-176. See [Milestones](../docs/prd.md#milestones-scope-and-testing).

## Scope

- Promote the verified wedding-day release, run production smoke and actual manifest/worker/install checks, and tag the release.

## Out of scope

- First invitation send and guest import are WED-176/177/159; later real menu load is WED-157.

## Acceptance criteria

- [ ] Production smoke passes for the domain and all mandatory invitation, check-in, ordering and admin flows.
- [ ] Manifest/HTTPS/worker checks pass and WED-114 real iOS/Android install evidence applies to this release; no Lighthouse PWA score is required.
- [ ] Backup/restore, rollback, queue-safe upgrades and security/device gates have passing prerequisite evidence.
- [ ] Release tag, changelog and deployed commit are recorded.

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
