---
id: WED-170
title: Add QR paper and accessible decorative accent tokens
epic: design-system
status: todo
priority: urgent
estimate: M
labels: [design, frontend]
module: theming
owner: ""
agent: ""
blocked_by: [WED-009, WED-011]
blocks: [WED-013, WED-014, WED-044, WED-094, WED-176, WED-181]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-170: Add QR paper and accessible decorative accent tokens

## Context

Backlog audit coverage: THM-1–7. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Extend the canonical theme schema using the committed invitation spike findings.

## Out of scope

- Work outside the stated contract; consuming screens and launch operations remain in their linked tickets. No product implementation is part of this audit.

## Acceptance criteria

- [ ] Add separate decorative accent/foreground and QR ink/paper tokens with accessible pair validation; update schema generation and theme documentation without creating a second incompatible token shape.
- [ ] Use ivory #FFF9EF, champagne #D6BE8D and chocolate #432B22 for the approved primary theme; champagne is decoration or fill with chocolate text, never low-contrast body text.
- [ ] Every preset renders a dark-on-light QR with four-module quiet zone, stable semantic status hues, and tested AA foreground/background pairs.

## Test plan

- Unit: reject failing accent pairs and invalid QR contrast. Manual: preview every component and a realistic signed QR at 375/768/1280 in all themes; record contrast calculations and scan evidence.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- src/modules/theming/; docs/theming.md

## Notes / decisions

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.

## Activity log

- 2026-10-21 — new → todo — divine
