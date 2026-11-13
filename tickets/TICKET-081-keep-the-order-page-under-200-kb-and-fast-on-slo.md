---
id: TICKET-081
title: Keep the order page under 200 KB and fast on slow networks
epic: ordering
status: in_progress
priority: high
estimate: M
labels: [frontend, test]
module: ordering
owner: divine
agent: codex
blocked_by: [TICKET-075, TICKET-073]
blocks: [TICKET-154]
branch: TICKET-081
pr: ""
created: 2026-10-21
updated: 2026-11-12
started: 2026-11-12
completed: ""
reason: ""
resume_to: ""
---

# TICKET-081: Keep the order page under 200 KB and fast on slow networks

## Context

The order page must stay under 200 KB so it loads on weak venue signal.

See: [Connectivity plan](../docs/prd.md#connectivity-plan-signal-unknown) · [Performance and reliability](../docs/prd.md#performance-and-reliability).

## Scope

- Measure transfer size; trim client JS; lazy-load photos.
- CI budget check.

## Out of scope

- Other pages' budgets (TICKET-116).

## Acceptance criteria

- [x] Total transferred bytes for /order first load ≤200 KB (Playwright measurement in CI).
- [x] Order-to-board time <2s on emulated slow 4G (e2e).

## Test plan

- End-to-end: Byte budget and timing.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/ordering/`
- `e2e/`

## Notes / decisions

2026-11-12: Native progressive ordering preserves shared server/business contracts. Final cold-wire tests pass 8/8 at 158478–181388 bytes; actual slow-4G Supabase delivery passes 378.475 ms. Existing 11 guest journeys and 96 font-rendering comparisons pass. See docs/plans/TICKET-081-pr.md and ADR0027 for evidence, native-rendering tradeoff and unverified release QA. CI is configured for both strict gates; hosted check results remain required before merge.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-12 — todo → claimed — divine (codex) — started ahead of TICKET-075 (in_review)
- 2026-11-12 — todo → in_progress — divine (codex) — started ahead of TICKET-075 (in_review)
