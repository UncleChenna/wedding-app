---
id: WED-088
title: Build the admin shell and navigation
epic: admin
status: todo
priority: high
estimate: M
labels: [frontend]
module: admin
owner: ""
agent: ""
blocked_by: [WED-017, WED-032]
blocks: [WED-048, WED-069, WED-089, WED-095, WED-096, WED-098, WED-101, WED-143]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-088: Build the admin shell and navigation

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
