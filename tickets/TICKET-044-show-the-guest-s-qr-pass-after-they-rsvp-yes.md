---
id: TICKET-044
title: Show the guest's QR pass after they RSVP yes
epic: invitations
status: done
priority: urgent
estimate: M
labels: [frontend, backend]
module: invitations
owner: divine
agent: codex
blocked_by: [TICKET-040, TICKET-056, TICKET-170, TICKET-183]
blocks: [TICKET-045, TICKET-046, TICKET-107, TICKET-116, TICKET-117, TICKET-131, TICKET-135, TICKET-138, TICKET-154, TICKET-158]
branch: TICKET-044
pr: https://github.com/UncleChenna/wedding-app/pull/74
created: 2026-10-21
updated: 2026-11-02
started: 2026-11-02
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

- [x] The QR decodes to the signed pass URL (unit test decodes the SVG).
- [x] Quiet zone ≥4 modules and contrast ≥4.5:1 in every theme (test).
- [x] The pass shows only after RSVP yes; declined or pending IVs see the RSVP form.
- [x] Returning guests reopening their personal invitation can go directly to their issued pass without replaying the envelope reveal. Wire the invitation layout pass slot to the real authorized signed-pass content and test first and return visits, including reduced motion.

- [x] Test a realistic signed-pass payload in every theme, using four-module quiet zone and adequate module size; the prototype QR density is not production evidence.

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

- 2026-11-02: Functional criteria verified with actual rendered SVG decoding, all-theme contrast/quiet-zone tests, and live accepted/declined/return/reduced-motion flows. Three production Lighthouse runs99/100/100, accessibility100 and CLS0 each. Full gate656 units/697 browser tests passes; additional normal and missing-key live modes pass. All24 screenshots inspected. Physical QR scans and WhatsApp/device QA remain unchecked release-blocking requirements in TICKET-201 under the standing preview-only exception; this is not production readiness.

2026-10-31: Owner approved retaining the returning-pass integration requirement here rather than TICKET-037. TICKET-037 supplies only the layout slot/anchor; this ticket must prove real signed-pass access and return visits. No implementation or completion is claimed by this scope clarification.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-02 — todo → claimed — divine (codex)
- 2026-11-02 — todo → in_progress — divine (codex)
- 2026-11-02 — in_progress → in_review — divine (codex)
