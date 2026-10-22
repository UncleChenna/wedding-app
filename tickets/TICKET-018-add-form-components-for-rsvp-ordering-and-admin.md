---
id: TICKET-018
title: Add form components for RSVP, ordering and admin
epic: design-system
status: in_progress
priority: urgent
estimate: M
labels: [frontend, design]
module: shared
owner: unclechenna
agent: claude
blocked_by: [TICKET-017]
blocks: [TICKET-021, TICKET-040, TICKET-050, TICKET-070]
branch: TICKET-018
pr: ""
created: 2026-10-21
updated: 2026-10-22
started: 2026-10-22
completed: ""
reason: ""
resume_to: ""
---

# TICKET-018: Add form components for RSVP, ordering and admin

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

- [x] Every control has an explicit label and an error state tested for `aria-invalid` and `aria-describedby`.
- [x] QuantityStepper respects min/max and is keyboard operable.
- [x] All controls are ≥44px tall at 375px.

## Test plan

- Unit: Testing Library per component.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/components/ui/`

## Notes / decisions

- 2026-10-22: Built on native elements (no new dependencies): Field (render prop for custom controls), Textarea, Select, Checkbox, RadioGroup, QuantityStepper. Input moved onto the same parts.
- 2026-10-22: Contract: explicit label; hint and error linked via aria-describedby; error sets aria-invalid and renders inside an always-present `aria-live=polite` region so it is announced on appearance. Radios: aria-invalid/describedby sit on the `radiogroup` because ARIA does not allow aria-invalid on `radio` (the test was corrected to match the spec before implementation).
- 2026-10-22: QuantityStepper: clamps to [min,max]; − / + are 44px and disabled at the bounds; ArrowUp/Down step, Home/End jump; typed values clamp on blur; controlled or uncontrolled.
- 2026-10-22: Found during build: RadioGroup always attached onChange, which Next.js rejects when rendered from a Server Component; now attached only when onValueChange is given. Found in screenshots: shared `w-full` overrode the stepper width because `cn` is plain clsx; shared control classes no longer set width.
- 2026-10-22: Evidence: 13 new unit tests (55 shared-UI tests pass); new browser smoke test for labels, radio selection, invalid checkbox and stepper keyboard bounds in both themes; 375px sweep extended to select, textarea and checkbox/radio label rows (0 under 44px); axe still 0 violations. `pnpm verify` passed on develop 3c2131e: 167 unit tests, build, 31 browser tests. Screenshots inspected at 375/768/1280 in both themes.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-22 — todo → claimed — unclechenna (claude)
- 2026-10-22 — todo → in_progress — unclechenna (claude)
