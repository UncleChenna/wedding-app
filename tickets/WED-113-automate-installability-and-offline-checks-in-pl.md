---
id: WED-113
title: Automate installability and offline checks in Playwright
epic: pwa
status: todo
priority: high
estimate: M
labels: [pwa, test]
module: shared
owner: ""
agent: ""
blocked_by: [WED-104, WED-106, WED-107, WED-108, WED-111]
blocks: [WED-114, WED-154]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-113: Automate installability and offline checks in Playwright

## Context

Installability and offline behaviour must stay green on every PR.

See: [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture) · [What "flawless" means in testing](../docs/prd.md#what-flawless-means-in-testing).

## Scope

- Manifest, icons, SW registration, offline pass, offline scanner in the smoke suite.
- Lighthouse PWA/installability audit in CI.

## Out of scope

- Real devices (WED-114).

## Acceptance criteria

- [ ] All checks run in `pnpm verify` or CI and fail on regression.

## Test plan

- End-to-end: PWA smoke.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `e2e/pwa.spec.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
