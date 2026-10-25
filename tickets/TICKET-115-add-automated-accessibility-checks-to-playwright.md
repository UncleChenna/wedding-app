---
id: TICKET-115
title: Add automated accessibility checks to Playwright
epic: quality
status: in_review
priority: high
estimate: M
labels: [test, frontend]
module: shared
owner: unclechenna
agent: claude
blocked_by: [TICKET-017]
blocks: [TICKET-117, TICKET-118]
branch: TICKET-115
pr: https://github.com/UncleChenna/wedding-app/pull/26
created: 2026-10-21
updated: 2026-10-25
started: 2026-10-25
completed: ""
reason: ""
resume_to: ""
---

# TICKET-115: Add automated accessibility checks to Playwright

## Context

WCAG AA must be checked on every route on every PR, not only in audits.

See: [Usability and accessibility](../docs/prd.md#usability-and-accessibility) · [Design principles (repo)](../docs/design-principles.md).

## Scope

- axe-core Playwright helper (approved dev dependency) run on every route in every theme.
- Fails on serious/critical violations.

## Out of scope

- Manual audits (TICKET-117, TICKET-118).

## Acceptance criteria

- [x] Every route in e2e/routes is scanned in every theme (test list).
- [x] An injected violation fails the suite (proved in notes).

- [x] Resolve all applicable WCAG A/AA violations regardless of axe severity; a moderate-severity AA failure still fails this gate.

## Test plan

- End-to-end: axe scan.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: End-to-end: run axe on representative states/themes and record manual checks for criteria axe cannot assess.

## Files likely touched

- `e2e/a11y.spec.ts`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-10-25 (unclechenna): The route list lives in `e2e/support/routes.ts` (7 pages plus the not-found page). `e2e/a11y-routes.spec.ts` (@smoke) scans each route in each theme (ivory-gold, midnight-champagne) on mobile and desktop: 32 scans, all clean. Tags: wcag2a/2aa/21a/21aa/22a/22aa, with no impact filter.
  - **Injected violation proof:** the permanent test "an injected violation fails the scan" renders an unlabelled input and an image without alt text, and asserts that `label` and `image-alt` are reported. Separately, removing `/admin` from the route list made the coverage test fail with `["/admin"]`.
  - The existing `/dev/theme` scan and the screenshot harness now share `scanA11y` and `applyTheme`; `wcag21a` and `wcag22a` were previously missing from the tag list.
  - Manual checks axe cannot assess remain with TICKET-117/118.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-25 — todo → claimed — unclechenna (claude)
- 2026-10-25 — todo → in_progress — unclechenna (claude)
- 2026-10-25 — in_progress → in_review — unclechenna (claude)
