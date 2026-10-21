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
blocked_by: [WED-104, WED-106, WED-107, WED-108, WED-111, WED-109, WED-110, WED-184]
blocks: [WED-114]
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

- Automated manifest, icons, HTTPS, service-worker control and offline pass/scanner checks in the smoke suite. Physical install checks remain WED-114.

## Out of scope

- Real devices (WED-114).

## Acceptance criteria

- [ ] Automated manifest/icon/worker/offline regressions fail pnpm verify or CI.
- [ ] Tests cover installed-shell navigation, offline pass and scanner, and WED-111 update behavior with pending events.
- [ ] Document the separate WED-114 iOS/Android install evidence; do not require a removed Lighthouse PWA score.

## Test plan

- End-to-end: HTTPS manifest/icon checks, worker control, offline navigation and safe update behavior.
- Manual: review the automated-versus-physical evidence split; actual devices are WED-114.

## Files likely touched

- `e2e/pwa.spec.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
