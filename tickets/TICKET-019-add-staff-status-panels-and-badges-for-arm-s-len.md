---
id: TICKET-019
title: Add staff status panels and badges for arm's-length reading
epic: design-system
status: in_review
priority: urgent
estimate: S
labels: [frontend, design]
module: shared
owner: unclechenna
agent: claude
blocked_by: [TICKET-010, TICKET-017]
blocks: [TICKET-021, TICKET-059, TICKET-076]
branch: TICKET-019
pr: https://github.com/UncleChenna/wedding-app/pull/20
created: 2026-10-21
updated: 2026-10-25
started: 2026-10-25
completed: ""
reason: ""
resume_to: ""
---

# TICKET-019: Add staff status panels and badges for arm's-length reading

## Context

Scanner results and board cards need large, high-contrast status components (≥32px identifiers, ≥18px text) with icon + text, not colour alone.

See: [Journey 2: check-in at the gate](../docs/prd.md#journey-2-check-in-at-the-gate) · [Design principles (repo)](../docs/design-principles.md) · [How theming works](../docs/prd.md#how-theming-works) (THM-4).

## Scope

- StatusPanel (valid/used/invalid/revoked/not RSVP'd) and StatusBadge.
- Icons with accessible names.
- Shown on /dev/theme in every theme.

## Out of scope

- Scanner logic (TICKET-060).

## Acceptance criteria

- [x] Panels render text and an icon for every status; no meaning depends on colour.
- [x] Identifiers render ≥32px and body ≥18px.
- [x] AA contrast in every theme (tested).

## Test plan

- Unit: Render and contrast tests.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/components/ui/`

## Notes / decisions

- 2026-10-25: Decision: scan result → colour mapping. Valid = green (success); Already used and Not RSVP'd = amber (warning: stop and check, not a refusal); Invalid and Revoked = red (danger: a problem). Each of the five has its own icon and text label so meaning never depends on colour. Recorded in `status-panel.tsx`.
- 2026-10-25: StatusPanel is a labelled `section` (role region named by its status label) with a `role=img` icon named "<label> icon", 36px display identifier (`text-4xl`) and 18px label/detail (`text-lg`). StatusBadge is a 44px-tall icon + text chip on the solid status colour for board cards.
- 2026-10-25: Evidence: 11 unit tests (labels, distinct icons, sizes, tone mapping, AA contrast of the exact panel and badge token pairs in every theme). Browser test checks computed font sizes (identifier ≥32px, label and detail ≥18px) and named icons for all five panels in both themes. axe 0 violations. Screenshots inspected at 375/768/1280.
- 2026-10-25: Integrated develop 4a81730 (TICKET-018) before PR; resolved an a11y.spec.ts conflict by keeping both tests. `pnpm verify` passed: 178 unit tests, build, 32 browser tests.
- 2026-10-25: Also filed TICKET-191 (stepper focus and typed-value fixes) from the PR #19 review nits.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-25 — todo → claimed — unclechenna (claude)
- 2026-10-25 — todo → in_progress — unclechenna (claude)
- 2026-10-25 — in_progress → in_review — unclechenna (claude)
