---
id: WED-157
title: Load the real guest list and menu
epic: launch
status: todo
priority: high
estimate: M
labels: [human, db]
module: ops
owner: ""
agent: ""
blocked_by: [WED-091, WED-095, WED-154]
blocks: [WED-159, WED-160]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-157: Load the real guest list and menu

## Context

The couple's real guests and the caterer's real menu go into production.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-1) · [Admin dashboard](../docs/prd.md#admin-dashboard) (ADM-4).

## Scope

- Import the CSV, fix errors, set party sizes and tag-along limits, enter the menu with stations and caps.

## Out of scope

- Sharing (WED-159).

## Acceptance criteria

- [ ] Guest and menu counts in production match the source spreadsheet (notes).
- [ ] No validation errors remain.

## Test plan

- Manual: Import with the couple.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/runbook.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
