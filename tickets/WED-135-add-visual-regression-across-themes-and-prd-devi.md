---
id: WED-135
title: Add visual regression across themes and PRD device sizes
epic: testing
status: todo
priority: medium
estimate: M
labels: [test, design]
module: shared
owner: ""
agent: ""
blocked_by: [WED-013, WED-044, WED-075]
blocks: []
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-135: Add visual regression across themes and PRD device sizes

## Context

Screenshots of every guest page for each preset at iPhone SE, iPhone 15, mid-range Android, iPad and desktop.

See: [What "flawless" means in testing](../docs/prd.md#what-flawless-means-in-testing).

## Scope

- Playwright toHaveScreenshot baselines per theme × device; CI on Linux with stable fonts.

## Out of scope

- Admin pages.

## Acceptance criteria

- [ ] A 1px colour change in a token fails the visual suite (proved).
- [ ] Baselines committed for every guest route × theme × device.

## Test plan

- End-to-end: Visual suite.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `e2e/visual/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
