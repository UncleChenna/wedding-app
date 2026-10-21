---
id: WED-142
title: Set up uptime checks for guest, scanner and board routes
epic: observability
status: todo
priority: medium
estimate: S
labels: [human, infra]
module: ops
owner: ""
agent: ""
blocked_by: [WED-143, WED-154]
blocks: [WED-164]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-142: Set up uptime checks for guest, scanner and board routes

## Context

Someone on call needs to know immediately if the site goes down on the day.

See: [Performance and reliability](../docs/prd.md#performance-and-reliability).

## Scope

- Free uptime monitor hitting /api/health and key routes every minute; alerts to both developers' phones.

## Out of scope

- Status page.

## Acceptance criteria

- [ ] Monitor exists and a test outage alert was received (notes).

## Test plan

- Manual: Account setup and alert test.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/runbook.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
