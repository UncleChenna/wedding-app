---
id: TICKET-046
title: Offer a printable PDF invitation with the QR
epic: invitations
status: todo
priority: urgent
estimate: L
labels: [frontend, backend]
module: invitations
owner: ""
agent: ""
blocked_by: [TICKET-011, TICKET-044]
blocks: [TICKET-131, TICKET-158, TICKET-176]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-046: Offer a printable PDF invitation with the QR

## Context

Some guests will print their pass; the PDF must wear the active theme.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-5) · [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture) · [How theming works](../docs/prd.md#how-theming-works) (THM-1).

## Scope

- `@react-pdf/renderer` (approved dependency) generating an A5 themed invitation with QR.
- Fonts embedded; works for long names.

## Out of scope

- Batch printing for admins.

## Acceptance criteria

- [ ] The PDF opens in Preview and Chrome; its QR decodes from a 300dpi print scan or rasterisation test.
- [ ] Colours and fonts follow the active theme (asserted on generated metadata).
- [ ] Generation takes <2s for one invitation.

## Test plan

- Unit: PDF generation smoke test.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/invitations/server/pdf.tsx`
- `src/app/(guest)/i/[token]/invitation.pdf/route.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
