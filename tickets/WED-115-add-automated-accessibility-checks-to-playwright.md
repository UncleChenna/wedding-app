---
id: WED-115
title: Add automated accessibility checks to Playwright
epic: quality
status: todo
priority: high
estimate: M
labels: [test, frontend]
module: shared
owner: ""
agent: ""
blocked_by: [WED-017]
blocks: [WED-117, WED-118]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-115: Add automated accessibility checks to Playwright

## Context

WCAG AA must be checked on every route on every PR, not only in audits.

See: [Usability and accessibility](../docs/prd.md#usability-and-accessibility) · [Design principles (repo)](../docs/design-principles.md).

## Scope

- axe-core Playwright helper (approved dev dependency) run on every route in every theme.
- Fails on serious/critical violations.

## Out of scope

- Manual audits (WED-117, WED-118).

## Acceptance criteria

- [ ] Every route in e2e/routes is scanned in every theme (test list).
- [ ] An injected violation fails the suite (proved in notes).

- [ ] Resolve all applicable WCAG A/AA violations regardless of axe severity; a moderate-severity AA failure still fails this gate.

## Test plan

- End-to-end: axe scan.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: End-to-end: run axe on representative states/themes and record manual checks for criteria axe cannot assess.

## Files likely touched

- `e2e/a11y.spec.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
