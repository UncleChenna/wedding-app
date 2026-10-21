---
id: TICKET-016
title: Add motion primitives that honour reduced motion
epic: design-system
status: in_progress
priority: urgent
estimate: M
labels: [design, frontend]
module: shared
owner: divine
agent: codex
blocked_by: []
blocks: [TICKET-021, TICKET-039]
branch: TICKET-016
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: 2026-10-21
completed: ""
reason: ""
resume_to: ""
---

# TICKET-016: Add motion primitives that honour reduced motion

## Context

Fades, rises and the envelope unfold need shared, token-driven motion that animates only opacity/transform and respects `prefers-reduced-motion`.

See: [Design principles](../docs/prd.md#design-principles) · [Design principles (repo)](../docs/design-principles.md).

## Scope

- Duration and easing tokens (150–300ms; ≤800ms signature).
- `FadeIn`/`Rise` primitives with CSS only where possible.
- Reduced-motion mode collapses to ≤150ms opacity.

## Out of scope

- The envelope reveal itself (TICKET-039).

## Acceptance criteria

- [ ] Primitives animate only `opacity` and `transform` (asserted in tests).
- [ ] With reduced motion emulated, no transform animation runs.
- [ ] Demonstrated on /dev/theme.

- [ ] Use 180ms control transitions and the 600ms signature envelope reveal; reduced motion removes transforms and uses no animation or at most 150ms fade.

## Test plan

- Unit: Render tests for class output.
- End-to-end: Playwright `emulateMedia({ reducedMotion: 'reduce' })` check.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: End-to-end: assert computed durations and reduced-motion behavior without delaying controls.

## Files likely touched

- `src/modules/shared/components/ui/`
- `src/app/globals.css`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-21 — todo → claimed — divine (codex)
- 2026-10-21 — todo → in_progress — divine (codex)
