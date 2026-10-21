---
id: TICKET-019
title: Add staff status panels and badges for arm's-length reading
epic: design-system
status: todo
priority: urgent
estimate: S
labels: [frontend, design]
module: shared
owner: ""
agent: ""
blocked_by: [TICKET-010, TICKET-017]
blocks: [TICKET-021, TICKET-059, TICKET-076]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
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

- [ ] Panels render text and an icon for every status; no meaning depends on colour.
- [ ] Identifiers render ≥32px and body ≥18px.
- [ ] AA contrast in every theme (tested).

## Test plan

- Unit: Render and contrast tests.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/components/ui/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
