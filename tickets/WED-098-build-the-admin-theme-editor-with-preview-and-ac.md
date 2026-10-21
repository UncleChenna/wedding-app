---
id: WED-098
title: Build the admin theme editor with preview and activate
epic: admin
status: todo
priority: medium
estimate: L
labels: [frontend, design]
module: admin
owner: ""
agent: ""
blocked_by: [WED-012, WED-088]
blocks: [WED-099]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-098: Build the admin theme editor with preview and activate

## Context

THM-6 (Should): colour pickers, curated fonts, live preview of IV and order page, then Activate; THM-3 rejects failing contrast on save.

See: [How theming works](../docs/prd.md#how-theming-works) (THM-3, THM-6).

## Scope

- Start from a preset; edit colours and fonts; live preview.
- Save rejected with failing pairs named; Activate switches the DB theme.

## Out of scope

- Palette generator (WED-022).

## Acceptance criteria

- [ ] Saving a failing theme shows each failing pair and does not save (e2e).
- [ ] Activate restyles the guest site without deploy (e2e).

## Test plan

- End-to-end: Save, reject, activate.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`
- `src/modules/theming/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
