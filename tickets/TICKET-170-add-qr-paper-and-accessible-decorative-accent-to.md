---
id: TICKET-170
title: Add QR paper and accessible decorative accent tokens
epic: design-system
status: in_progress
priority: urgent
estimate: M
labels: [design, frontend]
module: theming
owner: unclechenna
agent: claude
blocked_by: [TICKET-009, TICKET-011]
blocks: [TICKET-013, TICKET-014, TICKET-044, TICKET-094, TICKET-176, TICKET-181]
branch: TICKET-170
pr: ""
created: 2026-10-21
updated: 2026-10-27
started: 2026-10-27
completed: ""
reason: ""
resume_to: ""
---

# TICKET-170: Add QR paper and accessible decorative accent tokens

## Context

Backlog audit coverage: THM-1–7. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Extend the canonical theme schema using the committed invitation spike findings.

## Out of scope

- Work outside the stated contract; consuming screens and launch operations remain in their linked tickets. No product implementation is part of this audit.

## Acceptance criteria

- [x] Add separate decorative accent/foreground and QR ink/paper tokens with accessible pair validation; update schema generation and theme documentation without creating a second incompatible token shape.
- [x] Use ivory #FFF9EF, champagne #D6BE8D and chocolate #432B22 for the approved primary theme; champagne is decoration or fill with chocolate text, never low-contrast body text.
- [x] Every preset renders a dark-on-light QR with four-module quiet zone, stable semantic status hues, and tested AA foreground/background pairs.

## Test plan

- Unit: reject failing accent pairs and invalid QR contrast. Manual: preview every component and a realistic signed QR at 375/768/1280 in all themes; record contrast calculations and scan evidence.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- src/modules/theming/; docs/theming.md

## Notes / decisions

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.
- 2026-10-27 — Owner approved the `qrcode` dependency (plus `jsqr`, test-only) and recorded exact-path approval for `pnpm-lock.yaml` and the generated theme schema.
- 2026-10-27 — New tokens `decorative`, `decorative-foreground`, `qr-ink` and `qr-paper` live in the one existing token shape. Ivory & Gold: chocolate on champagne 7.22:1, QR ink on paper 12.47:1; champagne on the page is 1.71:1, so it is fill only (a test asserts this). Midnight & Champagne: text on champagne 9.74:1, QR 16.07:1, dark on light. `loadTheme` rejects failing pairs and any light-on-dark QR.
- 2026-10-27 — Shared `<QrCode>` (SVG, four-module quiet zone, medium error correction) shown on `/dev/theme`. Scan evidence: a unit test decodes every theme with jsQR, and an e2e test decodes the pixels Chromium paints, in both themes on phone and desktop. Real iOS/Android camera scans are not done (TICKET-201/TICKET-138). Status hues are unchanged and still gated.

## Activity log

- 2026-10-21 — new → todo — divine
- 2026-10-25 — todo → blocked — unclechenna (claude) — Needs a QR encoder (e.g. the qrcode npm package) to render and verify a real dark-on-light QR per theme (acceptance criterion 3). Adding a package changes pnpm-lock.yaml, which the owner has not authorised for this run (only theme-schema writes). Unblock by approving the dependency.
- 2026-10-27 — blocked → todo — unclechenna — Owner approved adding the qrcode dependency on 2026-10-27
- 2026-10-27 — todo → claimed — unclechenna (claude)
- 2026-10-27 — todo → in_progress — unclechenna (claude)
