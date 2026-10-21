---
id: TICKET-038
title: Add the full-bleed hero photo with blur placeholder
epic: invitations
status: todo
priority: urgent
estimate: M
labels: [frontend, design]
module: invitations
owner: ""
agent: ""
blocked_by: [TICKET-037, TICKET-008]
blocks: [TICKET-099, TICKET-116, TICKET-119, TICKET-154, TICKET-176]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-038: Add the full-bleed hero photo with blur placeholder

## Context

A full-bleed couple photo is the IV's hero; it must not cause layout shift or slow the page.

See: [Design principles](../docs/prd.md#design-principles) · [Design principles (repo)](../docs/design-principles.md).

## Scope

- `next/image` with accurate `sizes`, AVIF/WebP, `placeholder="blur"`, deliberate crops at three widths.
- Descriptive alt text from settings.

## Out of scope

- Photo upload UI (TICKET-099).

## Acceptance criteria

- [ ] CLS is 0 on /i/<token> in Lighthouse mobile.
- [ ] Network panel shows AVIF or WebP served at 375px.
- [ ] Subject is in frame at 375, 768 and 1280 (screenshots attached).

## Test plan

- End-to-end: CLS measured via PerformanceObserver in Playwright.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/invitations/components/`
- `public/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
