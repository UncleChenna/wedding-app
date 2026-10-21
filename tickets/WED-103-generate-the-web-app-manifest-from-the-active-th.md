---
id: WED-103
title: Generate the web app manifest from the active theme
epic: pwa
status: todo
priority: high
estimate: M
labels: [pwa, frontend]
module: shared
owner: ""
agent: ""
blocked_by: [WED-012, WED-102]
blocks: [WED-104, WED-109, WED-110]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-103: Generate the web app manifest from the active theme

## Context

The installed app should carry the couple's name and theme colours.

See: [Design principles](../docs/prd.md#design-principles) · [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture).

## Scope

- `app/manifest.ts` with name, short_name, start_url, display standalone, theme/background colours from the active theme.
- Separate start URLs considered for staff (scanner) vs guests.

## Out of scope

- Icons (WED-104).

## Acceptance criteria

- [ ] /manifest.webmanifest has valid name, start_url, scope, display and theme/background fields; icon requirements are completed by WED-104.
- [ ] Changing the active theme changes theme_color (unit).
- [ ] WED-113 verifies manifest/HTTPS/worker control and WED-114 records actual device installs; no removed Lighthouse PWA audit is required.

## Test plan

- Unit: Manifest builder.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: inspect browser install behavior and manifest errors; Lighthouse remains useful for performance/accessibility only.

## Files likely touched

- `src/app/manifest.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
