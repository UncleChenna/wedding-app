---
id: TICKET-044
title: Show the guest's QR pass after they RSVP yes
epic: invitations
status: todo
priority: urgent
estimate: M
labels: [frontend, backend]
module: invitations
owner: ""
agent: ""
blocked_by: [TICKET-040, TICKET-056, TICKET-170, TICKET-183]
blocks: [TICKET-045, TICKET-046, TICKET-107, TICKET-116, TICKET-117, TICKET-131, TICKET-135, TICKET-138, TICKET-154, TICKET-158]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-044: Show the guest's QR pass after they RSVP yes

## Context

After RSVP yes the same link always shows the QR, so on the day guests reopen it from WhatsApp.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-5) · [Journey 1: receiving the IV and RSVP](../docs/prd.md#journey-1-receiving-the-iv-and-rsvp) · [Design principles (repo)](../docs/design-principles.md).

## Scope

- Server-generated SVG QR of the signed pass URL (`qrcode` package, approved dependency).
- Dark-on-light, ≥4.5:1, four-module quiet zone, themed frame.
- PRD copy: "This is your key to the celebration…".

## Out of scope

- Downloads (TICKET-045, TICKET-046), offline (TICKET-107).

## Acceptance criteria

- [ ] The QR decodes to the signed pass URL (unit test decodes the SVG).
- [ ] Quiet zone ≥4 modules and contrast ≥4.5:1 in every theme (test).
- [ ] The pass shows only after RSVP yes; declined or pending IVs see the RSVP form.

- [ ] Test a realistic signed-pass payload in every theme, using four-module quiet zone and adequate module size; the prototype QR density is not production evidence.

## Test plan

- Unit: QR encode/decode round trip.
- End-to-end: RSVP yes then pass visible.
- Manual: Scan from an iPhone and an Android camera.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: scan printed and on-screen samples on approved devices in low light and glare.

## Files likely touched

- `src/modules/invitations/components/qr-pass.tsx`
- `src/modules/invitations/server/qr.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
