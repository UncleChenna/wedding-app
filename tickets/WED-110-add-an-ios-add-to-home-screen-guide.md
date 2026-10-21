---
id: WED-110
title: Add an iOS Add to Home Screen guide
epic: pwa
status: todo
priority: medium
estimate: S
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

# WED-110: Add an iOS Add to Home Screen guide

## Context

iOS has no install prompt; a short guide explains Share → Add to Home Screen.

See: [Design principles](../docs/prd.md#design-principles).

## Scope

- Detect iOS Safari not in standalone; bottom-sheet guide with illustrations from tokens.
- Note for WhatsApp in-app browser: open in Safari first.

## Out of scope

- Android.

## Acceptance criteria

- [ ] Guide shows on iOS Safari UA and not in standalone mode (unit).
- [ ] In WhatsApp's browser it explains opening in Safari (manual).

## Test plan

- Unit: Detection.
- Manual: iPhone check.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/components/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
