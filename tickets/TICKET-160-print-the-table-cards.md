---
id: TICKET-160
title: Print the table cards
epic: launch
status: todo
priority: medium
estimate: S
labels: [human]
module: ops
owner: ""
agent: ""
blocked_by: [TICKET-094, TICKET-156, TICKET-157, TICKET-146]
blocks: [TICKET-164]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-160: Print the table cards

## Context

Every table needs its card with the order QR and the router's Wi-Fi details.

See: [Admin dashboard](../docs/prd.md#admin-dashboard) (ADM-2) · [Connectivity plan](../docs/prd.md#connectivity-plan-signal-unknown).

## Scope

- Print on card stock; scan-test a sample in venue-like lighting.

## Out of scope

- Place cards.

## Acceptance criteria

- [ ] Every table has a card; a sample scans on iOS and Android (notes).

## Test plan

- Manual: Print and scan.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/runbook.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
