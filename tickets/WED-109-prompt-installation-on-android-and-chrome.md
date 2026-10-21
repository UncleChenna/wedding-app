---
id: WED-109
title: Prompt installation on Android and Chrome
epic: pwa
status: todo
priority: medium
estimate: M
labels: [pwa, frontend]
module: shared
owner: ""
agent: ""
blocked_by: [WED-103]
blocks: [WED-113]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-109: Prompt installation on Android and Chrome

## Context

Installing keeps the pass and scanner one tap away.

See: [Design principles](../docs/prd.md#design-principles).

## Scope

- Capture beforeinstallprompt; show a restrained install button on the pass and staff pages.
- Never on first paint; dismiss remembered.

## Out of scope

- iOS (WED-110).

## Acceptance criteria

- [ ] The button appears only when beforeinstallprompt fired (unit with a stub event).
- [ ] Dismissal persists for 30 days.

## Test plan

- Unit: Prompt state.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/components/install-prompt.tsx`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
