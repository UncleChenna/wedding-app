---
id: WED-098
title: Build the admin theme editor with preview and activate
epic: admin
status: todo
priority: medium
estimate: M
labels: [frontend, design]
module: admin
owner: ""
agent: ""
blocked_by: [WED-181, WED-088]
blocks: []
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

- Curated font/token editor, live invitation/order preview and Activate controls using WED-181 persistence; no duplicate server persistence implementation.

## Out of scope

- Palette generator (WED-022).

## Acceptance criteria

- [ ] Saving a failing theme shows each failing pair and does not save (e2e).
- [ ] Activate restyles the guest site without deploy (e2e).

- [ ] Use WED-181 for save/activate; show named contrast errors and prevent activation of invalid drafts while keeping the current live theme unchanged.

## Test plan

- End-to-end: Save, reject, activate.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: End-to-end: invalid draft, valid live preview, activation and initial server-rendered variables.

## Files likely touched

- `src/modules/admin/`
- `src/modules/theming/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
