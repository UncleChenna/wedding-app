---
id: TICKET-039
title: Add the envelope-opening reveal with reduced-motion fallback
epic: invitations
status: in_progress
priority: urgent
estimate: M
labels: [frontend, design]
module: invitations
owner: divine
agent: codex
blocked_by: [TICKET-016, TICKET-037]
blocks: [TICKET-138]
branch: TICKET-039
pr: ""
created: 2026-10-21
updated: 2026-10-31
started: 2026-10-31
completed: ""
reason: ""
resume_to: ""
---

# TICKET-039: Add the envelope-opening reveal with reduced-motion fallback

## Context

The PRD asks for a short envelope-opening reveal; principles cap it at 800ms and forbid delaying access to content.

See: [Design principles](../docs/prd.md#design-principles) · [Design principles (repo)](../docs/design-principles.md).

## Scope

- Opacity/transform-only unfold on first visit (600ms).
- Skippable; content is in the DOM and readable immediately.
- Reduced motion: ≤150ms fade or none.

## Out of scope

- Sound effects.

## Acceptance criteria

- [ ] Reveal completes in 600ms and animates only opacity/transform (asserted).
- [ ] With reduced motion, no transform animation runs (e2e).
- [ ] RSVP is reachable by keyboard during the animation.

- [ ] Use the spike-tested 600ms reveal and 180ms controls; returning guests bypass it. Content, focus and RSVP remain usable throughout.

## Test plan

- End-to-end: Animation duration and reduced-motion checks.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: End-to-end: first/return visit and reduced-motion timing assertions at 375px.

## Files likely touched

- `src/modules/invitations/components/envelope.tsx`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-31 — todo → claimed — divine (codex)
- 2026-10-31 — todo → in_progress — divine (codex)
