---
id: TICKET-088
title: Build the admin shell and navigation
epic: admin
status: todo
priority: urgent
estimate: M
labels: [frontend]
module: admin
owner: ""
agent: ""
blocked_by: [TICKET-017, TICKET-032]
blocks: [TICKET-043, TICKET-048, TICKET-064, TICKET-067, TICKET-069, TICKET-080, TICKET-089, TICKET-095, TICKET-096, TICKET-098, TICKET-099, TICKET-101, TICKET-143, TICKET-166, TICKET-174, TICKET-175]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-088: Build the admin shell and navigation

## Context

Every admin feature needs a protected, mobile-friendly shell.

See: [Admin dashboard](../docs/prd.md#admin-dashboard) · [Users and roles](../docs/prd.md#users-and-roles).

## Scope

- Layout with navigation (bottom on mobile, side on desktop), sign-out, current event name.

## Out of scope

- Feature pages.

## Acceptance criteria

- [ ] Navigation works by keyboard and at 375px (e2e).
- [ ] Unauthenticated access redirects to sign-in.

## Test plan

- End-to-end: Navigation.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/(admin)/`
- `src/modules/admin/components/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
