---
id: TICKET-200
title: Build table entry and menu ordering frontend previews
epic: ordering
status: in_progress
priority: urgent
estimate: M
labels: [frontend, design]
module: ordering
owner: divine
agent: codex
blocked_by: [TICKET-198]
blocks: []
branch: TICKET-200
pr: ""
created: 2026-10-26
updated: 2026-10-26
started: 2026-10-26
completed: ""
reason: ""
resume_to: ""
---

# TICKET-200: Build table entry and menu ordering frontend previews

## Context

The user requested visible frontend pages as the next delivery priority. See docs/frontend-delivery.md, docs/prd.md and docs/design-principles.md. This presentation slice must remain separate from production integration tickets.

## Scope

Build labelled /dev/order frontend previews for table number entry, menu categories, basket quantities, order review, sent and served states using sample menu data. Make simulated status changes explicit; do not submit orders to a backend.

## Out of scope

Persisted guest data, authentication, QR credentials, live orders and deployment. Do not close or bypass dependencies of existing integration tickets.

## Acceptance criteria

- [x] The complete preview journey works with clear sample-data and non-submission labels.
- [x] Input errors, empty states, back navigation and the terminal states are testable without a backend.
- [x] /dev navigation links the new preview; keyboard and reduced-motion behavior work.
- [x] Both registered themes pass axe and fit 375/768/1280px; screenshots are recorded and inspected.
- [x] Unit, end-to-end and full verification pass; production integration boundaries are documented.

## Test plan

- Unit: validation boundaries and transitions including invalid input and returning to earlier steps.
- End-to-end: complete and alternate outcomes, no network mutation, keyboard access, axe and responsive screenshots.
- Run pnpm verify:quick and pnpm verify. Review every item in docs/ui-checklist.md; report unavailable real-device checks honestly.

## Files likely touched

- src/app/dev/, relevant feature module components and tests, e2e/, per-ticket handoff and review evidence.

## Notes / decisions

- 2026-10-26: Complete labelled frontend preview; quick/full verification passed (242 unit, 155 browser, 17 conditional skips), 48 state screenshots reviewed and 12 route captures passed. No backend calls. Release QA deferred to TICKET-201 under explicit user approval; local Supabase startup failed and database readiness is not claimed.

- User-directed frontend priority. TICKET-015 stays paused. Depends on TICKET-198 for navigation and shared visual context.

## Activity log

- 2026-10-26 — new → todo — divine
- 2026-10-26 — todo → claimed — divine (codex)
- 2026-10-26 — todo → in_progress — divine (codex)
