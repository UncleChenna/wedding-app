---
id: WED-099
title: Add the IV design editor for photo and text
epic: admin
status: todo
priority: medium
estimate: L
labels: [frontend, backend]
module: admin
owner: ""
agent: ""
blocked_by: [WED-038, WED-098]
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

# WED-099: Add the IV design editor for photo and text

## Context

ADM-5 (Should): edit the IV photo and text with a preview.

See: [Admin dashboard](../docs/prd.md#admin-dashboard) (ADM-5).

## Scope

- Upload hero photo to Supabase Storage with size/type limits; generate blur placeholder.
- Edit headline, sub-line, venue text with preview.

## Out of scope

- Layout editing.

## Acceptance criteria

- [ ] Uploads over 8 MB or non-images are rejected (unit).
- [ ] Changes appear on /i/<token> after save (e2e).

## Test plan

- Unit: Upload validation.
- End-to-end: Edit and preview.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`
- `src/modules/invitations/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
