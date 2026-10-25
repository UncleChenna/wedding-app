---
id: TICKET-015
title: Define the typography scale and font roles
epic: design-system
status: in_progress
priority: urgent
estimate: M
labels: [design, frontend]
module: theming
owner: unclechenna
agent: claude
blocked_by: [TICKET-009]
blocks: [TICKET-021, TICKET-037]
branch: TICKET-015
pr: ""
created: 2026-10-21
updated: 2026-10-25
started: 2026-10-25
completed: ""
reason: ""
resume_to: ""
---

# TICKET-015: Define the typography scale and font roles

## Context

Design principles fix heading sizes, label tracking, body size and line height; components need named text styles, not ad hoc classes.

See: [Design principles](../docs/prd.md#design-principles) · [Design principles (repo)](../docs/design-principles.md).

## Scope

- Display, heading, label (small caps), body and staff text styles as Tailwind utilities.
- Optional script font role for the couple's names only.
- Fallback metrics to keep CLS at 0.

## Out of scope

- Changing fonts per theme beyond the curated list.

## Acceptance criteria

- [x] Headings are ≥32px at 375px and ≥48px at 1280px; body ≥16px with line-height 1.5–1.7; labels 0.08–0.15em tracking.
- [x] /dev/theme shows every text style in every theme.
- [ ] Lighthouse reports CLS 0 on `/dev/theme`.

## Test plan

- Unit: Snapshot of generated utilities.
- End-to-end: Computed-style assertions at 375 and 1280.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/globals.css`
- `src/modules/theming/components/fonts.ts`

## Notes / decisions

- 2026-10-25: Named @utility styles in globals.css (type-script, -display, -heading, -subheading, -label, -body-lg, -body, -staff-id, -staff), listed with intended uses in src/modules/theming/lib/typography.ts. Fluid clamp() sizes: display 40px at 375 to 69px at 1280, heading 32px at 375 to 48px at 1280. Optional fonts.script (schema rebuilt by pnpm themes:schema under the owner's approval); --font-script falls back to the display font, so no extra font is loaded.
- 2026-10-25: Evidence: unit tests parse globals.css and check every style's rules; browser tests check computed sizes, tracking and line height at 375 and 1280 in both themes; an e2e Layout Instability observer measures CLS exactly 0 on /dev/theme (mobile and desktop). `pnpm verify` passed on develop 36fdf31: 219 unit tests, build, 50 browser tests. Screenshots inspected.
- 2026-10-25: NOT DONE: criterion 3 requires Lighthouse itself. Running Lighthouse via npx was denied (external code), and adding it as a dependency needs a lockfile approval the owner has not given. The e2e CLS measurement uses the same browser API Lighthouse uses, but it is not Lighthouse, so the criterion stays unticked. Ticket blocked; draft PR opened.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-25 — todo → claimed — unclechenna (claude)
- 2026-10-25 — todo → in_progress — unclechenna (claude)
