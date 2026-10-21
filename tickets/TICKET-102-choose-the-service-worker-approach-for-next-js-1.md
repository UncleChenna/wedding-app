---
id: TICKET-102
title: Choose the service worker approach for Next.js 16 in an ADR
epic: pwa
status: todo
priority: urgent
estimate: S
labels: [pwa, docs]
module: shared
owner: ""
agent: ""
blocked_by: []
blocks: [TICKET-103, TICKET-105]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
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

- [ ] ADR merged with the decision, versions, and rejected options with reasons.
- [ ] Prototype builds with `pnpm build` (evidence in notes).

## Test plan

- Manual: Prototype build.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/decisions/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
