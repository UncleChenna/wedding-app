---
id: TICKET-013
title: Ship third and fourth preset themes
epic: design-system
status: in_review
priority: urgent
estimate: M
labels: [design, frontend]
module: theming
owner: unclechenna
agent: claude
blocked_by: [TICKET-010, TICKET-011, TICKET-170]
blocks: [TICKET-014, TICKET-021, TICKET-135]
branch: TICKET-013
pr: https://github.com/UncleChenna/wedding-app/pull/51
created: 2026-10-21
updated: 2026-10-27
started: 2026-10-27
completed: ""
reason: ""
resume_to: ""
---

# TICKET-013: Ship third and fourth preset themes

## Context

THM-5 asks for 3–4 presets to start from; we have two.

See: [How theming works](../docs/prd.md#how-theming-works) (THM-5).

## Scope

- Two new presets with distinct moods (e.g. sage garden, blush editorial).
- Each passes the contrast gate and the UI checklist.

## Out of scope

- The couple's custom theme (TICKET-014).

## Acceptance criteria

- [x] Four themes are registered and listed on /dev/theme.
- [x] Screenshots of /dev/theme at 375/768/1280 in all four themes are attached.
- [x] `pnpm verify` passes.

- [x] Use the spike pairings: Cormorant Garamond + Inter for Ivory & Gold, Playfair Display + Inter for Emerald Night, and Cormorant Garamond + Jost for Blush & Sage. Preserve fixed semantic success/warning/error hues.

## Test plan

- End-to-end: Visual screenshots for every theme.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: compare all three complete presets at 375/768/1280, including long guest names and all scanner results.

## Files likely touched

- `src/modules/theming/themes/`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-10-27 — Added Emerald Night (dark, Playfair Display + Inter) and Blush & Sage (light, Cormorant Garamond + Jost) from the spike's `spikes/invitation/themes/*.json`. The spike defined seven colours; the rest (surfaces, secondary, input, ring, status sets, decorative, QR) were derived and pass the contrast, status-hue and QR gates on the first run. QR is spike ink `#18251F` on white in both. Radii follow the spike's 4px. Patterns left out (optional); the spike SVGs are not yet in the mask format.
- 2026-10-27 — The active pair is unchanged (Ivory & Gold light, Midnight & Champagne dark), so guests see no change. Screenshots of `/`, `/dev/theme`, `/invite`, `/order`, `/checkin` at 375/768/1280 in all four themes were inspected; axe, typography, decoration, QR and smoke specs pass in every theme.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-27 — todo → claimed — unclechenna (claude)
- 2026-10-27 — todo → in_progress — unclechenna (claude)
- 2026-10-27 — in_progress → in_review — unclechenna (claude)
