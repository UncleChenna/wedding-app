---
id: TICKET-113
title: Automate installability and offline checks in Playwright
epic: pwa
status: done
priority: high
estimate: M
labels: [pwa, test]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-104, TICKET-106, TICKET-107, TICKET-108, TICKET-111, TICKET-109, TICKET-110, TICKET-184]
blocks: [TICKET-114]
branch: TICKET-113
pr: https://github.com/UncleChenna/wedding-app/pull/179
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

- [x] Automated manifest/icon/worker/offline regressions fail pnpm verify or CI.
- [x] Tests cover installed-shell navigation, offline pass and scanner, and TICKET-111 update behavior with pending events.
- [x] Document the separate TICKET-114 iOS/Android install evidence; do not require a removed Lighthouse PWA score.

## Test plan

- End-to-end: HTTPS manifest/icon checks, worker control, offline navigation and safe update behavior.
- Manual: review the automated-versus-physical evidence split; actual devices are TICKET-114.

## Files likely touched

- `e2e/pwa.spec.ts`

## Notes / decisions

2026-11-13: Integrated develop 979609e6 after TICKET-111 merged. Production build, HTTPS/offline-pass/update-prompt browser checks and 15 update-safety unit cases pass. Independent review found no remaining issues. Detailed evidence: docs/plans/TICKET-113-pr.md. Physical installation remains TICKET-114.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-13 — todo → claimed — divine (codex) — started ahead of TICKET-111 (in_review)
- 2026-11-13 — todo → in_progress — divine (codex) — started ahead of TICKET-111 (in_review)
- 2026-11-13 — in_progress → blocked — divine (codex) — Implementation reviewed and published in PR179; waiting for TICKET-111 PR176 to pass CI and merge before dependency integration.
- 2026-11-13 — blocked → in_progress — divine (codex)
- 2026-11-13 — in_progress → in_review — divine (codex)
- 2026-11-13 — in_review → in_progress — divine (codex) — Coordinated handoff to integrate current develop and the reviewed TICKET-237 diagnostic repair; preserve unresolved scanner CI evidence.
