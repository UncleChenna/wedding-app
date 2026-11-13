---
id: TICKET-116
title: Gate guest pages on Lighthouse mobile scores of 95 or more
epic: quality
status: todo
priority: high
estimate: L
labels: [test, infra]
module: shared
owner: ""
agent: ""
blocked_by: [TICKET-044, TICKET-072, TICKET-038]
blocks: [TICKET-154]
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
- Merged from TICKET-121 (Fail e2e on layout shift or console errors on guest pages):
  - Playwright fixture recording console errors and CLS for guest routes.

## Out of scope

- Admin pages.

## Acceptance criteria

- [ ] CI fails when Performance or Accessibility drops below 95 on any guest page.
- [ ] Current scores recorded in notes.

- [ ] Measure the invitation and order pages on mobile with realistic images/fonts and completed RSVP states; keep the PRD Lighthouse performance target of at least 95 and order payload under 200KB.
- [ ] (from TICKET-121) Any console error or CLS > 0 on a guest route fails the suite (proved in notes).

## Test plan

- End-to-end: Lighthouse CI.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: record build, device/network profile, payload accounting and repeated performance runs.
- (TICKET-121) End-to-end: Fixture.

## Files likely touched

- `.github/workflows/ci.yml`
- `lighthouserc.json`

## Notes / decisions

_Agents append dated notes here while working._
- 2026-11-12 (unclechenna, claude): TICKET-228 merged TICKET-121 into this ticket (all unstarted) to cut per-ticket overhead. Their scope, criteria and dependencies are above; the merged tickets are cancelled.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
