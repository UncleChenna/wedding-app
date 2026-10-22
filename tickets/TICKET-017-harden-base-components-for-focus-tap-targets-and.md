---
id: TICKET-017
title: Harden base components for focus, tap targets and dialogs
epic: design-system
status: in_review
priority: urgent
estimate: L
labels: [frontend, design]
module: shared
owner: unclechenna
agent: claude
blocked_by: [TICKET-010]
blocks: [TICKET-018, TICKET-019, TICKET-029, TICKET-037, TICKET-088, TICKET-115]
branch: TICKET-017
pr: https://github.com/UncleChenna/wedding-app/pull/18
created: 2026-10-21
updated: 2026-10-22
started: 2026-10-22
completed: ""
reason: ""
resume_to: ""
---

# TICKET-017: Harden base components for focus, tap targets and dialogs

## Context

Button, Card, Input, Sheet and Toast exist but are unverified against the 44px, focus, dialog and bottom-sheet rules every feature will reuse.

See: [Design principles](../docs/prd.md#design-principles) · [Usability and accessibility](../docs/prd.md#usability-and-accessibility) · [Design principles (repo)](../docs/design-principles.md).

## Scope

- 44×44 targets, visible 3:1 focus rings, disabled/loading states.
- Sheet as a bottom sheet on mobile with focus trap, Escape and focus return.
- Toast with `aria-live` and no colour-only meaning.

## Out of scope

- New form controls (TICKET-018).

## Acceptance criteria

- [x] Each component has tests for keyboard operation and labels.
- [x] Sheet traps focus, closes on Escape and restores focus to its trigger (e2e).
- [x] axe reports no violations on /dev/theme in both themes.

## Test plan

- Unit: Testing Library keyboard tests.
- End-to-end: Sheet focus test at 375px.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/components/ui/`

## Notes / decisions

- 2026-10-22: Findings fixed: Button `sm` was 36px (now 44px, all sizes `min-w-11`); toast dismiss was 32px (now 44px with a focus ring); loading spinner kept spinning under reduced motion (`motion-reduce:animate-none`); toast tone was colour-only (now icon + sr-only "Success:"/"Error:"; errors use an assertive `role=alert` region).
- 2026-10-22: Sheet: the old comment claimed native `<dialog>` traps focus. It does not: Tab past the last control escaped to browser UI (caught by the new e2e). Added an explicit Tab/Shift+Tab wrap. Escape and focus return to the trigger are native and now proven at 375px in both themes; it renders as a bottom sheet (bottom edge = viewport bottom).
- 2026-10-22: axe: first scan flagged colour contrast on the motion demo card text; it was measured mid-600ms fade. Scanning after finite animations settle finds 0 violations (WCAG 2.0/2.1/2.2 A/AA tags) with the sheet closed and open; both themes are on the page.
- 2026-10-22: Dependency: `@axe-core/playwright` 4.14.0 (dev, pure JS) added with `pnpm add -D` under an owner-approved exact-path lockfile write; approval file deleted after the commit.
- 2026-10-22: Evidence: `pnpm verify` passed on develop d105dbb (190 tickets, 154 unit tests, build, 30 browser tests; 10 skips are mobile-only checks in the desktop project). Screenshots of /dev/theme at 375/768/1280 in both themes inspected.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-22 — todo → claimed — unclechenna (claude)
- 2026-10-22 — todo → in_progress — unclechenna (claude)
- 2026-10-22 — in_progress → in_review — unclechenna (claude)
