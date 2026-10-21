---
id: WED-161
title: Write the day-of runbook with fallbacks
epic: launch
status: todo
priority: high
estimate: M
labels: [docs]
module: ops
owner: ""
agent: ""
blocked_by: [WED-069, WED-143, WED-153, WED-055, WED-155, WED-169]
blocks: [WED-162]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-161: Write the day-of runbook with fallbacks

## Context

On the day, anyone on call must know what to do when something fails.

See: [Performance and reliability](../docs/prd.md#performance-and-reliability) · [Testing plan](../docs/prd.md#testing-plan) · [Connectivity plan](../docs/prd.md#connectivity-plan-signal-unknown).

## Scope

- docs/runbook.md: timeline, roles, devices, router setup, printed guest list, backup device, scanner offline procedure, alert failure, rollback, contacts.
- One-page printable version.

## Out of scope

- Training (WED-162).

## Acceptance criteria

- [ ] Every failure mode in the PRD testing plan has a step-by-step fallback.
- [ ] Printable one-pager fits on A4.

- [ ] Include printed morning guest list, staff manual-order fallback, router with external antenna/backup SIM, spare charged devices and Wi-Fi instructions on table cards; keep passwords in private operational handoff, not git.

## Test plan

- Manual: Read-through with the couple.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: airplane-mode rehearsal and router/SIM failover at the venue with named staff roles.

## Files likely touched

- `docs/runbook.md`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
