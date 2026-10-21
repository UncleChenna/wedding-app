---
id: TICKET-157
title: Load and reconcile the real wedding menu
epic: launch
status: todo
priority: high
estimate: M
labels: [human, db]
module: ops
owner: ""
agent: ""
blocked_by: [TICKET-095, TICKET-154, TICKET-177]
blocks: [TICKET-160]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-157: Load and reconcile the real wedding menu

## Context

The couple's real guests and the caterer's real menu go into production.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-1) · [Admin dashboard](../docs/prd.md#admin-dashboard) (ADM-4).

## Scope

- Load owner-approved kitchen/bar menu, prices fixed at free, item caps and initial availability. Real guests are imported earlier in TICKET-177.

## Out of scope

- Sharing (TICKET-159).

## Acceptance criteria

- [ ] Owner verifies every menu category, station, item cap, dietary label and availability against the approved menu.
- [ ] Kitchen and bar previews receive only their station items; no real guest import or RSVP reset occurs.
- [ ] Record menu counts and sign-off without committing private guest data.

## Test plan

- Manual: Import with the couple.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/runbook.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
