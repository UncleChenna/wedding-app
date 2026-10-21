---
id: WED-045
title: Let guests save their pass as an image
epic: invitations
status: todo
priority: urgent
estimate: M
labels: [frontend, backend]
module: invitations
owner: ""
agent: ""
blocked_by: [WED-044]
blocks: [WED-131, WED-138, WED-158, WED-176]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-045: Let guests save their pass as an image

## Context

"Save to Photos" gives guests a screenshot-free copy that works at a gate with no signal.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-5) · [Journey 1: receiving the IV and RSVP](../docs/prd.md#journey-1-receiving-the-iv-and-rsvp).

## Scope

- PNG endpoint rendering the themed pass (name, party size, QR).
- Download/share button that works in WhatsApp's in-app browser (fallback: open image in new tab with save hint).

## Out of scope

- Wallet passes (out of v1; see docs/current-state.md).

## Acceptance criteria

- [ ] The PNG is ≥1080px wide, the QR in it decodes, and it contains no data beyond name and party size.
- [ ] The endpoint only serves a valid, non-revoked token (tested).
- [ ] Download works on iOS Safari and Android Chrome (manual, recorded).

## Test plan

- Unit: PNG decode test.
- Manual: iOS and Android save-to-photos check.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/(guest)/i/[token]/pass.png/route.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
