---
id: TICKET-099
title: Add the IV design editor for photo and text
epic: admin
status: todo
priority: medium
estimate: M
labels: [frontend, backend]
module: admin
owner: ""
agent: ""
blocked_by: [TICKET-038, TICKET-088, TICKET-175]
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

# TICKET-099: Add the IV design editor for photo and text

## Context

ADM-5 (Should): edit the IV photo and text with a preview.

See: [Admin dashboard](../docs/prd.md#admin-dashboard) (ADM-5).

## Scope

- Invitation photo and wording editor UI using TICKET-175 validated upload service; approved wording and fallback hero are retained.

## Out of scope

- Layout editing.

## Acceptance criteria

- [ ] Uploads over 8 MB or non-images are rejected (unit).
- [ ] Changes appear on /i/<token> after save (e2e).
- [ ] Editor previews clearly distinguish stock fallback from the saved photo; fallback alt text never identifies stock subjects as the couple. Saving a photo does not certify TICKET-008 final publication rights or couple approval.

- [ ] Use TICKET-175 upload service; do not reimplement image parsing or storage policies in the editor. Preview approved wording and recover from upload failure without losing saved text.

## Test plan

- Unit: Upload validation.
- End-to-end: Edit and preview.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: End-to-end: rejected image, valid photo, failed save and reload of saved invitation.

## Files likely touched

- `src/modules/admin/`
- `src/modules/invitations/`

## Notes / decisions

- 2026-11-13 — TICKET-236: Preview implementation can use the approved stock asset; final launch still requires TICKET-008. Keep TICKET-038/088/175 prerequisites and the existing upload/failure contract.

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
