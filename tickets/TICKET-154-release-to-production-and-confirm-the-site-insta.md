---
id: TICKET-154
title: Release to production and confirm the site installs as a PWA
epic: deployment
status: todo
priority: high
estimate: M
labels: [infra, pwa, test]
module: ops
owner: ""
agent: ""
blocked_by: [TICKET-008, TICKET-044, TICKET-050, TICKET-067, TICKET-068, TICKET-079, TICKET-080, TICKET-081, TICKET-085, TICKET-092, TICKET-093, TICKET-094, TICKET-097, TICKET-100, TICKET-101, TICKET-114, TICKET-116, TICKET-117, TICKET-118, TICKET-119, TICKET-120, TICKET-124, TICKET-126, TICKET-129, TICKET-130, TICKET-131, TICKET-132, TICKET-133, TICKET-134, TICKET-135, TICKET-136, TICKET-137, TICKET-140, TICKET-145, TICKET-153, TICKET-166, TICKET-174, TICKET-180, TICKET-012, TICKET-038, TICKET-176, TICKET-231, TICKET-238]
blocks: [TICKET-157, TICKET-162, TICKET-164]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-154: Release to production and confirm the site installs as a PWA

## Context

Full wedding-day app release after the earlier invitation release TICKET-176. See [Milestones](../docs/prd.md#milestones-scope-and-testing).

## Scope

- Promote the verified wedding-day release, run production smoke and actual manifest/worker/install checks, and tag the release.

## Out of scope

- First invitation send and guest import are TICKET-176/177/159; later real menu load is TICKET-157.

## Acceptance criteria

- [ ] TICKET-008 final domain choice, >=2400px hero and square assets, both-partner publication rights and final visual approval are recorded; TICKET-146 confirms actual domain ownership/DNS/HTTPS. Stock-preview permission alone is not final launch approval.

- [ ] Production smoke passes for the domain and all mandatory invitation, check-in, ordering and admin flows.
- [ ] Manifest/HTTPS/worker checks pass and TICKET-114 real iOS/Android install evidence applies to this release; no Lighthouse PWA score is required.
- [ ] Backup/restore, rollback, queue-safe upgrades and security/device gates have passing prerequisite evidence.
- [ ] Release tag, changelog and deployed commit are recorded.

## Test plan

- End-to-end: Production smoke.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/deployment.md`
- `CHANGELOG.md`

## Notes / decisions

- 2026-11-13 — TICKET-236: Preview/theme implementation is independent of final approvals; all original release checks remain required, with TICKET-008 now an explicit direct prerequisite.

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
