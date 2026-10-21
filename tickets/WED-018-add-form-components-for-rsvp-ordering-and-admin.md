---
id: WED-018
title: Add form components for RSVP, ordering and admin
epic: design-system
status: todo
priority: urgent
estimate: M
labels: [frontend, design]
module: shared
owner: ""
agent: ""
blocked_by: [WED-017]
blocks: [WED-021, WED-040, WED-050, WED-070]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-018: Add form components for RSVP, ordering and admin

## Context

RSVP, the order page and admin need radios, selects, checkboxes, a textarea and a quantity stepper built once on tokens.

See: [Design principles](../docs/prd.md#design-principles) · [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-4) · [Table ordering](../docs/prd.md#table-ordering) (ORD-3).

## Scope

- RadioGroup, Select, Checkbox, Textarea, QuantityStepper, Field with label/help/error.
- Errors announced to screen readers.
- Shown on /dev/theme.

## Out of scope

- Feature-specific validation.

## Acceptance criteria

- [ ] Every control has an explicit label and an error state tested for `aria-invalid` and `aria-describedby`.
- [ ] QuantityStepper respects min/max and is keyboard operable.
- [ ] All controls are ≥44px tall at 375px.

## Test plan

- Unit: Testing Library per component.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/components/ui/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
