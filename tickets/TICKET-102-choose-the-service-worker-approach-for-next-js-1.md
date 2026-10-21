---
id: TICKET-102
title: Choose the service worker approach for Next.js 16 in an ADR
epic: pwa
status: in_progress
priority: urgent
estimate: S
labels: [pwa, docs]
module: shared
owner: divine
agent: codex
blocked_by: []
blocks: [TICKET-103, TICKET-105]
branch: TICKET-102
pr: https://github.com/UncleChenna/wedding-app/pull/10
created: 2026-10-21
updated: 2026-10-21
started: 2026-10-21
completed: ""
reason: ""
resume_to: ""
---

# TICKET-102: Choose the service worker approach for Next.js 16 in an ADR

## Context

The offline gate, guest pass and installability all depend on one service worker setup that works with Next 16, Turbopack and Cache Components.

See: [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture).

## Scope

- Read node_modules/next/dist/docs PWA guidance; evaluate Serwist vs a hand-written worker.
- Prototype precache + runtime caching in a branch; record bundle and build impact.

## Out of scope

- Implementation (TICKET-105).

## Acceptance criteria

- [x] ADR records the decision, versions, and rejected options with reasons, ready for human review; only the human merges it before this ticket becomes done.
- [x] Prototype builds with `pnpm build` (evidence in notes).

## Test plan

- Manual: Prototype build.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/decisions/`

## Notes / decisions

- 2026-10-21: Resolved develop conflicts, preserving merged prerequisite fixes and progress history. Quick and full verification passed: 108 unit tests, production build, 17 browser smoke passes and 7 existing skips.

- 2026-10-21: Resolved develop conflicts, preserving merged prerequisite fixes and progress history. Quick and full verification passed: 106 unit tests, production build, 17 browser smoke passes and 7 existing skips.

- 2026-10-21: ADR 0014 proposes a custom allowlisted worker; Serwist Turbopack evaluated from its primary documentation without installation. Prototype production builds and Chromium offline checks passed. Worker: 1,494 bytes / 643 gzip; static build output unchanged at 1,373,288 bytes; sequential warm builds 9,184ms baseline / 4,817ms prototype (not a comparative benchmark). Quick and full gates passed: 104 unit tests, 17 smoke passes, 7 existing skips. Production registration, private offline data, iOS and update/outbox behavior remain downstream work. Clarified the original merged-ADR criterion to distinguish review readiness from the mandatory human merge required for done; no merge performed.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-21 — todo → claimed — divine (codex)
- 2026-10-21 — todo → in_progress — divine (codex)
- 2026-10-21 — in_progress → in_review — divine (codex)
- 2026-10-21 — in_review → in_progress — divine (codex) — Resolve remaining PR conflicts with develop
- 2026-10-21 — in_review → in_progress — divine (codex) — Resolve new conflicts after PR 9 merged
