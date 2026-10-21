---
id: WED-108
title: Make the scanner app shell work fully offline
epic: pwa
status: todo
priority: high
estimate: M
labels: [pwa, frontend]
module: checkin
owner: ""
agent: ""
blocked_by: [WED-059, WED-105, WED-169]
blocks: [WED-065, WED-113, WED-136]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-108: Make the scanner app shell work fully offline

## Context

Scanners must load and scan even if the device reloads with no signal.

See: [Gate check-in](../docs/prd.md#gate-check-in) (CHK-6).

## Scope

- Precache scanner route, scanner JS and decoder assets.
- Staff session survives offline reload until expiry.

## Out of scope

- Data cache (WED-065).

## Acceptance criteria

- [ ] An offline reload of /checkin shows the scanner ready (e2e).
- [ ] Decoder assets are precached (test lists them).

## Test plan

- End-to-end: Offline reload.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/sw.ts`
- `src/modules/checkin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
