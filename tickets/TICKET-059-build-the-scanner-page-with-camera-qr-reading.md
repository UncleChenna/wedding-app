---
id: TICKET-059
title: Build the scanner page with camera QR reading
epic: checkin
status: in_review
priority: high
estimate: L
labels: [frontend]
module: checkin
owner: divine
agent: codex
blocked_by: [TICKET-019, TICKET-031, TICKET-057, TICKET-032]
blocks: [TICKET-060, TICKET-108, TICKET-124]
branch: TICKET-059
pr: https://github.com/UncleChenna/wedding-app/pull/135
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-09
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

- [x] Decodes a test QR from a fake camera stream in Chromium and WebKit e2e.
- [x] Denied camera permission shows a recovery message and keyboard-accessible manual check-in help; TICKET-063 must replace the interim help destination with authenticated name search before gate release.
- [x] Same QR held in view is processed once per 3 seconds.

## Test plan

- End-to-end: Playwright with fake media stream.
- Manual: Scan printed and on-screen codes on two real phones.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/checkin/components/scanner.tsx`
- `src/app/(staff)/checkin/`

## Notes / decisions

2026-11-09: Manual search remains mandatory under CHK-4 in TICKET-063. Its admission/cache prerequisites follow this camera foundation, so requiring completed search here would invert the build order. This ticket provides truthful interim help; it neither admits guests nor claims name search exists. TICKET-063 owns the final link and denied-camera search journey; physical two-phone checks remain release evidence, not a simulated-camera claim.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — divine (codex) — started ahead of TICKET-057 (blocked)
- 2026-11-09 — todo → in_progress — divine (codex) — started ahead of TICKET-057 (blocked)
- 2026-11-09 — in_progress → in_review — divine (codex)
- 2026-11-09 — in_review → blocked — divine (codex) — Final combined CI exposed merged TICKET-173 scan-sync coverage below the mandatory per-file gate; TICKET-223 adds the missing safety-boundary tests. Scanner, camera and authenticated browser jobs pass; hold merge until repair and final CI pass.
- 2026-11-09 — blocked → in_review — divine (codex) — Verified develop PR141 repaired shared coverage; updated branch passes1519 tests with all critical coverage gates.
