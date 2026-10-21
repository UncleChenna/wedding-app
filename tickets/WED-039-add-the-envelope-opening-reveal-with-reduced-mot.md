---
id: WED-039
title: Add the envelope-opening reveal with reduced-motion fallback
epic: invitations
status: todo
priority: medium
estimate: M
labels: [frontend, design]
module: invitations
owner: ""
agent: ""
blocked_by: [WED-016, WED-037]
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

# WED-039: Add the envelope-opening reveal with reduced-motion fallback

## Context

The PRD asks for a short envelope-opening reveal; principles cap it at 800ms and forbid delaying access to content.

See: [Design principles](../docs/prd.md#design-principles) · [Design principles (repo)](../docs/design-principles.md).

## Scope

- Opacity/transform-only unfold on first visit (≤800ms).
- Skippable; content is in the DOM and readable immediately.
- Reduced motion: ≤150ms fade or none.

## Out of scope

- Sound effects.

## Acceptance criteria

- [ ] Reveal completes in ≤800ms and animates only opacity/transform (asserted).
- [ ] With reduced motion, no transform animation runs (e2e).
- [ ] RSVP is reachable by keyboard during the animation.

## Test plan

- End-to-end: Animation duration and reduced-motion checks.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/invitations/components/envelope.tsx`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
