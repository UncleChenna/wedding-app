---
id: TICKET-156
title: Buy the 4G router, backup SIM, power banks and backup device
epic: launch
status: todo
priority: medium
estimate: S
labels: [human]
module: ops
owner: ""
agent: ""
blocked_by: [TICKET-155]
blocks: [TICKET-160, TICKET-163]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-156: Buy the 4G router, backup SIM, power banks and backup device

## Context

Scanners and boards run on a dedicated router with an external antenna and a backup SIM on another network.

See: [Connectivity plan](../docs/prd.md#connectivity-plan-signal-unknown) · [Testing plan](../docs/prd.md#testing-plan).

## Scope

- Router + antenna, SIM on a second network, power banks and chargers, one spare phone.

## Out of scope

- Venue Wi-Fi.

## Acceptance criteria

- [ ] Kit list with Wi-Fi name recorded in docs/runbook.md; router tested at home with both SIMs.

## Test plan

- Manual: Purchase and test.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/runbook.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
