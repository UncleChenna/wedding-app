---
id: TICKET-199
title: Build the RSVP frontend preview with confirmation states
epic: invitations
status: todo
priority: urgent
estimate: M
labels: [frontend, design]
module: invitations
owner: ""
agent: ""
blocked_by: [TICKET-198]
blocks: []
branch: ""
pr: ""
created: 2026-10-26
updated: 2026-10-26
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-199: Build the RSVP frontend preview with confirmation states

## Context

The user requested visible frontend pages as the next delivery priority. See docs/frontend-delivery.md, docs/prd.md and docs/design-principles.md. This presentation slice must remain separate from production integration tickets.

## Scope

Build a labelled /dev/rsvp frontend preview with attending yes/no, named tag-alongs, meal selection, validation and both confirmation outcomes. Use the invitation layout and approved PRD wording. Responses stay in memory; do not claim persistence.

## Out of scope

Persisted guest data, authentication, QR credentials, live orders and deployment. Do not close or bypass dependencies of existing integration tickets.

## Acceptance criteria

- [ ] The complete preview journey works with clear sample-data and non-submission labels.
- [ ] Input errors, empty states, back navigation and the terminal states are testable without a backend.
- [ ] /dev navigation links the new preview; keyboard and reduced-motion behavior work.
- [ ] Both registered themes pass axe and fit 375/768/1280px; screenshots are recorded and inspected.
- [ ] Unit, end-to-end and full verification pass; production integration boundaries are documented.

## Test plan

- Unit: validation boundaries and transitions including invalid input and returning to earlier steps.
- End-to-end: complete and alternate outcomes, no network mutation, keyboard access, axe and responsive screenshots.
- Run pnpm verify:quick and pnpm verify. Review every item in docs/ui-checklist.md; report unavailable real-device checks honestly.

## Files likely touched

- src/app/dev/, relevant feature module components and tests, e2e/, per-ticket handoff and review evidence.

## Notes / decisions

- User-directed frontend priority. TICKET-015 stays paused. Depends on TICKET-198 for navigation and shared visual context.

## Activity log

- 2026-10-26 — new → todo — divine
