---
id: WED-166
title: "Close the event: expire PINs, close ordering, export memories"
epic: launch
status: todo
priority: medium
estimate: M
labels: [backend, docs]
module: admin
owner: ""
agent: ""
blocked_by: [WED-164]
blocks: [WED-167]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-166: Close the event: expire PINs, close ordering, export memories

## Context

After the wedding, staff access ends and the couple keep non-personal memories (counts, timeline, menu stats) before data is deleted.

See: [Security](../docs/prd.md#security) · [Privacy (UK GDPR)](../docs/prd.md#privacy-uk-gdpr).

## Scope

- Admin action: expire all PINs, close ordering, revoke devices.
- Export a memories pack (anonymous stats, RSVP counts, menu popularity) as PDF/CSV.

## Out of scope

- Deletion (WED-168).

## Acceptance criteria

- [ ] After the action no staff session works (e2e).
- [ ] The memories export contains no contact details or dietary notes (test).

## Test plan

- Unit: Export contents.
- End-to-end: Close event.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
