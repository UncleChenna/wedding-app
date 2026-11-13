---
id: TICKET-113
title: Automate installability and offline checks in Playwright
epic: pwa
status: in_progress
priority: high
estimate: M
labels: [pwa, test]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-104, TICKET-106, TICKET-107, TICKET-108, TICKET-111, TICKET-109, TICKET-110, TICKET-184]
blocks: [TICKET-114]
branch: TICKET-113
pr: ""
created: 2026-10-21
updated: 2026-11-13
started: 2026-11-13
completed: ""
reason: ""
resume_to: ""
---

# TICKET-113: Automate installability and offline checks in Playwright

## Context

Installability and offline behaviour must stay green on every PR.

See: [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture) · [What "flawless" means in testing](../docs/prd.md#what-flawless-means-in-testing).

## Scope

- Automated manifest, icons, HTTPS, service-worker control and offline pass/scanner checks in the smoke suite. Physical install checks remain TICKET-114.

## Out of scope

- Real devices (TICKET-114).

## Acceptance criteria

- [ ] Automated manifest/icon/worker/offline regressions fail pnpm verify or CI.
- [ ] Tests cover installed-shell navigation, offline pass and scanner, and TICKET-111 update behavior with pending events.
- [ ] Document the separate TICKET-114 iOS/Android install evidence; do not require a removed Lighthouse PWA score.

## Test plan

- End-to-end: HTTPS manifest/icon checks, worker control, offline navigation and safe update behavior.
- Manual: review the automated-versus-physical evidence split; actual devices are TICKET-114.

## Files likely touched

- `e2e/pwa.spec.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-13 — todo → claimed — divine (codex) — started ahead of TICKET-111 (in_review)
- 2026-11-13 — todo → in_progress — divine (codex) — started ahead of TICKET-111 (in_review)
- 2026-11-13 — in_progress → blocked — divine (codex) — Implementation reviewed and published in PR179; waiting for TICKET-111 PR176 to pass CI and merge before dependency integration.
- 2026-11-13 — blocked → in_progress — divine (codex)
