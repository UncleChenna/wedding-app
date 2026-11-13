---
id: TICKET-014
title: Create the couple's theme from their approved colours
epic: design-system
status: done
priority: urgent
estimate: S
labels: [design, frontend]
module: theming
owner: divine
agent: codex
blocked_by: [TICKET-013, TICKET-170]
blocks: [TICKET-176]
branch: TICKET-014
pr: https://github.com/UncleChenna/wedding-app/pull/190
created: 2026-10-21
updated: 2026-11-13
started: 2026-11-13
completed: 2026-11-13
reason: ""
resume_to: ""
---

# TICKET-014: Create the couple's theme from their approved colours

## Context

The live site should wear the couple's own colours from TICKET-008.

See: [How theming works](../docs/prd.md#how-theming-works) · [Open questions](../docs/prd.md#open-questions).

## Scope

- New theme JSON from the chosen colours; contrast-checked.
- Make it the default active theme.

## Out of scope

- Palette generator (TICKET-022).

## Acceptance criteria

- [x] The couple's theme passes the contrast gate.
- [x] Record screenshots of `/` and `/dev/theme` at 375/768/1280 and independent design/UI-checklist review. Final couple approval remains an explicit TICKET-008 release requirement.

- [x] Use ivory #FFF9EF, champagne #D6BE8D and chocolate #432B22, with chocolate text/controls and champagne as decoration or accessible fill. Include the spike QR/accent token additions.

## Test plan

- Manual: Review screenshots against the approved palette and design principles; record actual results without inferring couple approval.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: implementation screenshots plus measured AA text contrast; final visual approval is retained in TICKET-008.

## Files likely touched

- `src/modules/theming/themes/`

## Notes / decisions

- 2026-11-13 — TICKET-236: Theme tokens do not require photos or a purchased domain. Implementation uses the user-approved palette; no final couple visual approval is claimed by completing this ticket.

- 2026-11-13 — Updated the existing default ivory-gold preset, retaining its stable ID and dark scheme. Exact approved palette contract reproduced a failure before the token update; all 163 theme tests now pass. Production screenshots cover both required routes × four themes × three widths; 15 keyboard/axe/motion browser checks pass. Final couple approval remains TICKET-008; physical-device and fresh performance evidence remain release requirements in TICKET-201. See docs/plans/TICKET-014-pr.md.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
- 2026-11-13 — in_progress → in_review — divine (codex)
- 2026-11-13 — in_review → in_progress — divine (codex) — CI correctly requires regenerating preset-derived PWA icons after palette changes
- 2026-11-13 — in_review → done — divine (codex)
