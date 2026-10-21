---
id: WED-008
title: Decide domain, wedding colours and photos for the first theme
epic: design-system
status: todo
priority: high
estimate: S
labels: [human, design]
module: theming
owner: ""
agent: ""
blocked_by: []
blocks: [WED-014, WED-146]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-008: Decide domain, wedding colours and photos for the first theme

## Context

Open question in the PRD. The couple's own theme, Open Graph image, icons and table cards all need the domain, colours and photos.

See: [Open questions](../docs/prd.md#open-questions) · [How theming works](../docs/prd.md#how-theming-works).

## Scope

- Pick the domain name (to buy in WED-146).
- Pick 1–2 wedding colours.
- Supply a hero photo (at least 2400px wide) and a square photo for icons and previews, with rights to publish.

## Out of scope

- Building the theme (WED-014).

## Acceptance criteria

- [ ] Domain name, hex colours and photo files are recorded in notes (photos in a shared folder linked from notes).
- [ ] Photo usage is agreed with both partners.

## Test plan

- Manual: Couple decides; agent records.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `tickets/ (notes only)`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
