---
id: TICKET-103
title: Generate the web app manifest from the active theme
epic: pwa
status: in_progress
priority: high
estimate: M
labels: [pwa, frontend]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-012, TICKET-102]
blocks: [TICKET-104, TICKET-109, TICKET-110]
branch: TICKET-103
pr: ""
created: 2026-10-21
updated: 2026-10-31
started: 2026-10-31
completed: ""
reason: ""
resume_to: ""
---

# TICKET-103: Generate the web app manifest from the active theme

## Context

The installed app should carry the couple's name and theme colours.

See: [Design principles](../docs/prd.md#design-principles) · [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture).

## Scope

- `app/manifest.ts` with name, short_name, start_url, display standalone, theme/background colours from the active theme.
- Separate start URLs considered for staff (scanner) vs guests.

## Out of scope

- Icons (TICKET-104).

## Acceptance criteria

- [x] /manifest.webmanifest has valid name, start_url, scope, display and theme/background fields; icon requirements are completed by TICKET-104.
- [x] Changing the active theme changes theme_color (unit).
- [ ] TICKET-113 verifies manifest/HTTPS/worker control and TICKET-114 records actual device installs; no removed Lighthouse PWA audit is required.

## Test plan

- Unit: Manifest builder.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: inspect browser install behavior and manifest errors; Lighthouse remains useful for performance/accessibility only.

## Files likely touched

- `src/app/manifest.ts`

## Notes / decisions

2026-10-31: First two criteria verified by seven unit tests and three production browser checks, including stored theme/name updates without rebuilding. Chromium parsing evidence: docs/reviews/TICKET-103/browser-manifest.json. The113/114 criterion remains unchecked; those downstream tickets are not completed here. Docs/pwa.md records their ownership and staff-start considerations. Full verification pending.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-31 — todo → claimed — divine (codex)
- 2026-10-31 — todo → in_progress — divine (codex)
