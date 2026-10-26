---
id: TICKET-195
title: Wait for colour transitions after applying a theme in e2e helpers
epic: quality
status: backlog
priority: medium
estimate: S
labels: [test]
module: shared
owner: ""
agent: ""
blocked_by: []
blocks: []
branch: ""
pr: ""
created: 2026-10-25
updated: 2026-10-25
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-195: Wait for colour transitions after applying a theme in e2e helpers

## Context

`applyTheme` in `e2e/support/theme.ts` swaps the `--t-*` variables on <html> and waits only for fonts. Elements with `transition-colors` (every `Button`) are still mid-transition, so the screenshot harness captures them in the previous theme's colours. Found in TICKET-106: on `/offline` in midnight-champagne, "Try again" read rgb(122, 92, 36) (ivory-gold primary) right after the swap and rgb(217, 185, 122) 400ms later. Screenshots used for UI review can therefore misrepresent a theme, and any colour assertion made straight after `applyTheme` is unreliable. Real pages are unaffected: the theme is rendered on the server.

See: [Design principles (repo)](../docs/design-principles.md) §10 (review every theme).

## Scope

- `applyTheme` waits for running finite animations and transitions to finish after the swap (reuse `settleAnimations`).

## Out of scope

- Changing component transitions.

## Acceptance criteria

- [ ] Immediately after `applyTheme(page, midnight)`, a Button's background equals the midnight primary (e2e test).
- [ ] `pnpm screenshots` shows themed buttons in midnight-champagne (inspected).

## Test plan

- End-to-end: colour assertion straight after `applyTheme`.
- Gate: `pnpm verify` passes.

## Files likely touched

- `e2e/support/theme.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-25 — new → backlog — unclechenna
