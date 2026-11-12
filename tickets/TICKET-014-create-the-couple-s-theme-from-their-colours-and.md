---
id: TICKET-014
title: Create the couple's theme from their colours and photos
epic: design-system
status: todo
priority: urgent
estimate: L
labels: [design, human]
module: theming
owner: ""
agent: ""
blocked_by: [TICKET-008, TICKET-013, TICKET-170, TICKET-037]
blocks: [TICKET-176, TICKET-099, TICKET-116, TICKET-154]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-014: Create the couple's theme from their colours and photos

## Context

The live site should wear the couple's own colours from TICKET-008.

See: [How theming works](../docs/prd.md#how-theming-works) · [Open questions](../docs/prd.md#open-questions).

## Scope

- New theme JSON from the chosen colours; contrast-checked.
- Make it the default active theme.
- Merged from TICKET-038 (Add the full-bleed hero photo with blur placeholder):
  - `next/image` with accurate `sizes`, AVIF/WebP, `placeholder="blur"`, deliberate crops at three widths.
  - Descriptive alt text from settings.
- Merged from TICKET-119 (Optimise every image for AVIF/WebP, sizes and blur):
  - Audit all images; enforce `sizes`, formats, blur, dimensions; lint/test helper.

## Out of scope

- Palette generator (TICKET-022).

## Acceptance criteria

- [ ] The couple's theme passes the contrast gate.
- [ ] Screenshots of `/` and `/dev/theme` at three widths are approved by the couple in notes.

- [ ] Use ivory #FFF9EF, champagne #D6BE8D and chocolate #432B22, with chocolate text/controls and champagne as decoration or accessible fill. Include the spike QR/accent token additions.
- [ ] (from TICKET-038) CLS is 0 on /i/<token> in Lighthouse mobile.
- [ ] (from TICKET-038) Network panel shows AVIF or WebP served at 375px.
- [ ] (from TICKET-038) Subject is in frame at 375, 768 and 1280 (screenshots attached).
- [ ] (from TICKET-119) A test fails if any next/image lacks sizes or dimensions on guest routes.
- [ ] (from TICKET-119) Largest image on /i/<token> ≤150 KB at 375px.

## Test plan

- Manual: Couple approves screenshots.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: approved palette screenshots plus measured AA text contrast, not a new palette decision.
- (TICKET-038) End-to-end: CLS measured via PerformanceObserver in Playwright.
- (TICKET-119) Unit: Image usage scan.

## Files likely touched

- `src/modules/theming/themes/`

## Notes / decisions

_Agents append dated notes here while working._
- 2026-11-12 (unclechenna, claude): TICKET-228 merged TICKET-038, TICKET-119 into this ticket (all unstarted) to cut per-ticket overhead. Their scope, criteria and dependencies are above; the merged tickets are cancelled.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
