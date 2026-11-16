---
id: TICKET-137
title: Load test 350 guests at the gate and 30 tables ordering
epic: testing
status: blocked
priority: high
estimate: L
labels: [test, infra]
module: shared
owner: UncleChenna
agent: claude
blocked_by: [TICKET-068, TICKET-073, TICKET-149, TICKET-026, TICKET-133]
blocks: [TICKET-154, TICKET-163]
branch: TICKET-137
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: "Load tool and local evidence done; the staging run waits on TICKET-149"
resume_to: ""
---

# TICKET-137: Load test 350 guests at the gate and 30 tables ordering

## Context

All guests scanned within 45 minutes across 3 devices; 30 tables ordering within the same 5 minutes; scan <1s, order-to-board <2s.

See: [Testing plan](../docs/prd.md#testing-plan) · [Performance and reliability](../docs/prd.md#performance-and-reliability).

## Scope

- k6 or Playwright-driven script against a staging deployment with the load seed.
- Report p50/p95 timings and errors.

## Out of scope

- Production load.

## Acceptance criteria

- [ ] p95 scan-to-result <1s and order-to-board <2s at target load (report in docs/audits/).
- [ ] Zero failed orders or lost check-ins.

- [ ] Exercise 350 guests, three scanners over 45 minutes and 30 tables ordering over five minutes on isolated staging data; record sub-second check-in and two-second board-delivery results against an agreed measurement protocol.

## Test plan

- Manual: Run against staging.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Load: repeat the PRD workload with latency/error distributions and no real guest data; failures block release.

## Files likely touched

- `scripts/load/`
- `docs/audits/`

## Notes / decisions

- 2026-11-13: `pnpm load:test` (scripts/load/run.ts) drives the real endpoints of a running build: three
  gate devices read and admit every attending invitation's signed pass over the gate window, while 30 tables
  each send a food+drink order over the order window; order-to-board is timed by polling the kitchen and bar
  board endpoints every 100 ms. Afterwards it checks the admission counters and orders table so nothing was
  lost, and writes a report to docs/audits/. Local evidence: docs/audits/TICKET-137-load-2026-11-13.md
  (PRD protocol: 45-minute gate, 5-minute ordering) on a local production build. Remaining: rerun with
  `--staging --base-url …` on isolated staging data once TICKET-149 exists, and record that report here.
- 2026-11-13: Local results and the stall diagnosis are in docs/audits/TICKET-137-load-notes.md. On a
  loaded machine scans and orders stalled for minutes: every connection queued on the shared
  `request_budgets` row lock. TICKET-258 makes that check a single statement. On a quiet machine all
  targets pass. Nothing was ever lost.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
