---
id: TICKET-059
title: Build the scanner page with camera QR reading
epic: checkin
status: todo
priority: high
estimate: L
labels: [frontend]
module: checkin
owner: ""
agent: ""
blocked_by: [TICKET-019, TICKET-031, TICKET-057, TICKET-032]
blocks: [TICKET-060, TICKET-108, TICKET-124]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-059: Build the scanner page with camera QR reading

## Context

Gate staff scan from a phone or tablet camera with no app install.

See: [Gate check-in](../docs/prd.md#gate-check-in) (CHK-1) · [Journey 2: check-in at the gate](../docs/prd.md#journey-2-check-in-at-the-gate) · [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture).

## Scope

- BarcodeDetector where available; zxing-based fallback (approved dependency).
- Camera permission states with clear instructions; torch toggle if supported.
- Debounce repeated reads of the same code.

## Out of scope

- Result screens (TICKET-060).

## Acceptance criteria

- [ ] Decodes a test QR from a fake camera stream in Chromium and WebKit e2e.
- [ ] Denied camera permission shows a recovery message and manual search link.
- [ ] Same QR held in view is processed once per 3 seconds.

## Test plan

- End-to-end: Playwright with fake media stream.
- Manual: Scan printed and on-screen codes on two real phones.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/checkin/components/scanner.tsx`
- `src/app/(staff)/checkin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
