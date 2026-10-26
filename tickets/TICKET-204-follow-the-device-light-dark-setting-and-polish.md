---
id: TICKET-204
title: Follow the device light/dark setting and polish every page for phones
epic: design-system
status: in_progress
priority: high
estimate: M
labels: [frontend, design]
module: theming
owner: unclechenna
agent: claude
blocked_by: []
blocks: []
branch: TICKET-204
pr: ""
created: 2026-10-26
updated: 2026-10-26
started: 2026-10-26
completed: ""
reason: ""
resume_to: ""
---

# TICKET-204: Follow the device light/dark setting and polish every page for phones

## Context

The couple likes both preset themes and wants each guest to see the one that matches their phone: Midnight & Champagne in dark mode and Ivory & Gold in light mode. Today one theme is hard-coded in `src/modules/theming/config.ts` and its variables are written inline on `<html>`, so a `prefers-color-scheme` rule cannot override them. They also want every page to work well on phones.

See: [Design principles (repo)](../docs/design-principles.md) §6 (mobile and thumb-first), §7 (CLS = 0, no flash), §10 (every theme); [theming](../docs/theming.md).

## Scope

- Replace the single active theme with a light/dark pair (`ivory-gold` light, `midnight-champagne` dark) in `config.ts`.
- Render both themes' variables from the server as CSS: light on `:root`, dark inside `@media (prefers-color-scheme: dark)`. No client JS and no flash of the wrong theme.
- `color-scheme: light dark`, and a `theme-color` meta for each scheme so the phone's browser bar matches.
- Guest paper texture follows the scheme (Ivory & Gold has one, Midnight & Champagne has none).
- Global error page, OG image and e2e helpers keep working with the pair.
- Mobile pass on every route at 375px in both schemes: no horizontal scroll, 44px tap targets, safe-area insets, readable sizes. Fix what is found.

## Out of scope

- Database-stored or admin-editable theme (TICKET-012, TICKET-098, TICKET-181).
- A manual light/dark toggle for guests.
- Real-device WhatsApp checks (TICKET-201).

## Acceptance criteria

- [ ] With `prefers-color-scheme: light` every page renders in Ivory & Gold; with `dark` in Midnight & Champagne (e2e test with emulated media).
- [ ] The server HTML contains both themes' variables; `<html>` has no inline `--t-*` variables (unit + e2e).
- [ ] `theme-color` meta tags exist for light and dark with each theme's background.
- [ ] The guest paper texture shows only in light mode; staff and admin stay plain.
- [ ] Every route has no horizontal scroll at 375px in both schemes, and interactive controls are at least 44×44px (e2e).
- [ ] Screenshots of every route at 375/768/1280 in both themes inspected.
- [ ] `pnpm verify` passes.

## Test plan

- Unit: CSS generation for the scheme pair; config validation (light slot is a light theme, dark slot a dark theme).
- End-to-end: emulate both colour schemes and check computed colours, the pattern layer and mobile layout on every route.
- Manual: `pnpm screenshots`; switch the OS appearance on a phone.

## Files likely touched

- `src/modules/theming/{config.ts,lib/registry.ts,lib/css-vars.ts,components/}`
- `src/app/layout.tsx`, `src/app/global-error.tsx`, `src/app/(guest)/layout.tsx`
- `e2e/support/theme.ts`, `e2e/*.spec.ts`
- `docs/theming.md`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-26 — new → todo — unclechenna
- 2026-10-26 — todo → claimed — unclechenna (claude)
- 2026-10-26 — todo → in_progress — unclechenna (claude)
