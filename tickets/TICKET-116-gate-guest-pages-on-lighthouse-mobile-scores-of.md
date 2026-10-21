---
id: TICKET-116
title: Gate guest pages on Lighthouse mobile scores of 95 or more
epic: quality
status: todo
priority: high
estimate: M
labels: [test, infra]
module: shared
owner: ""
agent: ""
blocked_by: [TICKET-038, TICKET-044, TICKET-072]
blocks: [TICKET-121, TICKET-154]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-116: Gate guest pages on Lighthouse mobile scores of 95 or more

## Context

The PRD and design principles require Lighthouse mobile Performance and Accessibility ≥95 on guest pages.

See: [Design principles](../docs/prd.md#design-principles) · [Design principles (repo)](../docs/design-principles.md).

## Scope

- Lighthouse CI against a production build for /i/<fixture>, pass page, /order.
- Budgets in config; scores recorded.

## Out of scope

- Admin pages.

## Acceptance criteria

- [ ] CI fails when Performance or Accessibility drops below 95 on any guest page.
- [ ] Current scores recorded in notes.

- [ ] Measure the invitation and order pages on mobile with realistic images/fonts and completed RSVP states; keep the PRD Lighthouse performance target of at least 95 and order payload under 200KB.

## Test plan

- End-to-end: Lighthouse CI.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: record build, device/network profile, payload accounting and repeated performance runs.

## Files likely touched

- `.github/workflows/ci.yml`
- `lighthouserc.json`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
