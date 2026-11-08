---
id: TICKET-131
title: Cover the invitation, RSVP and pass journey end to end
epic: testing
status: in_review
priority: urgent
estimate: M
labels: [test]
module: invitations
owner: divine
agent: codex
blocked_by: [TICKET-041, TICKET-042, TICKET-044, TICKET-045, TICKET-046]
blocks: [TICKET-154, TICKET-176]
branch: TICKET-131
pr: https://github.com/UncleChenna/wedding-app/pull/83
created: 2026-10-21
updated: 2026-11-03
started: 2026-11-03
completed: ""
reason: ""
resume_to: ""
---

# TICKET-131: Cover the invitation, RSVP and pass journey end to end

## Context

Journey 1 must never break.

See: [Journey 1: receiving the IV and RSVP](../docs/prd.md#journey-1-receiving-the-iv-and-rsvp).

## Scope

- Open IV → RSVP yes → tag-alongs → pass → edit → lock, tagged @smoke where fast.

## Out of scope

- Visual checks.

## Acceptance criteria

- [x] The journey passes on mobile and desktop projects in CI.

## Test plan

- End-to-end: Journey spec.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `e2e/guest.spec.ts`

## Notes / decisions

- 2026-11-03 — Approved CI job passes both projects: run41732191620, job126252318493, 2tests7.4s on27e54fb. Full local gate also passes852unit/769browser tests.

- 2026-11-03 — Complete real guest journey passes both local browser projects; full verify passes. CI criterion remains open pending approval of the concrete dedicated database/browser job in docs/reviews/TICKET-131/ci-proposal.md.

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-03 — todo → claimed — divine (codex)
- 2026-11-03 — todo → in_progress — divine (codex)
- 2026-11-03 — in_progress → blocked — divine (codex) — Local full verification and mobile/desktop journey pass; awaiting explicit approval for concrete dedicated CI job in PR83, required for CI acceptance.
- 2026-11-03 — blocked → in_progress — divine (codex) — User approved the proposed dedicated guest journey CI job
- 2026-11-03 — in_progress → in_review — divine (codex)
