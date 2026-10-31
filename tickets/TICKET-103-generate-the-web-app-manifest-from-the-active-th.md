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
- [x] Document TICKET-113 ownership of manifest/HTTPS/worker checks and TICKET-114 ownership of real-device install checks; both remain mandatory and are not certified by TICKET-103. No removed Lighthouse PWA audit is required.

## Test plan

- Unit: Manifest builder.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: inspect browser install behavior and manifest errors; Lighthouse remains useful for performance/accessibility only.

## Files likely touched

- `src/app/manifest.ts`

## Notes / decisions

2026-10-31: First two criteria verified by seven unit tests and three production browser checks, including stored theme/name updates without rebuilding. Chromium parsing evidence: docs/reviews/TICKET-103/browser-manifest.json. Docs/pwa.md records downstream ownership and staff-start considerations. Full verification passed: 496 unit tests / 26 skips, build, 529 browser tests / 135 skips. On 2026-10-31 the user approved clarifying the final criterion as documentation of mandatory downstream checks, not certification that TICKET-113/114 are complete.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-31 — todo → claimed — divine (codex)
- 2026-10-31 — todo → in_progress — divine (codex)
- 2026-10-31 — in_progress → blocked — divine (codex) — Draft PR https://github.com/UncleChenna/wedding-app/pull/61 passes full verification; awaiting approval to clarify circular downstream TICKET-113/114 acceptance wording without claiming those checks complete
- 2026-10-31 — blocked → in_progress — divine (codex) — User approved clarification of mandatory downstream verification ownership
