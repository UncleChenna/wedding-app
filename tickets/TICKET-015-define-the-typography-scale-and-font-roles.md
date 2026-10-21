---
id: TICKET-015
title: Define the typography scale and font roles
epic: design-system
status: todo
priority: urgent
estimate: M
labels: [design, frontend]
module: theming
owner: ""
agent: ""
blocked_by: [TICKET-009]
blocks: [TICKET-021, TICKET-037]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-015: Define the typography scale and font roles

## Context

Design principles fix heading sizes, label tracking, body size and line height; components need named text styles, not ad hoc classes.

See: [Design principles](../docs/prd.md#design-principles) · [Design principles (repo)](../docs/design-principles.md).

## Scope

- Display, heading, label (small caps), body and staff text styles as Tailwind utilities.
- Optional script font role for the couple's names only.
- Fallback metrics to keep CLS at 0.

## Out of scope

- Changing fonts per theme beyond the curated list.

## Acceptance criteria

- [ ] Headings are ≥32px at 375px and ≥48px at 1280px; body ≥16px with line-height 1.5–1.7; labels 0.08–0.15em tracking.
- [ ] /dev/theme shows every text style in every theme.
- [ ] Lighthouse reports CLS 0 on `/dev/theme`.

## Test plan

- Unit: Snapshot of generated utilities.
- End-to-end: Computed-style assertions at 375 and 1280.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/globals.css`
- `src/modules/theming/components/fonts.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
