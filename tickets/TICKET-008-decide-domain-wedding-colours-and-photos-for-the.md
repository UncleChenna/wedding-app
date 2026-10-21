---
id: TICKET-008
title: Decide domain, wedding colours and photos for the first theme
epic: design-system
status: todo
priority: urgent
estimate: S
labels: [human, design]
module: theming
owner: ""
agent: ""
blocked_by: []
blocks: [TICKET-014, TICKET-038, TICKET-146]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-008: Decide domain, wedding colours and photos for the first theme

## Context

Open question in the PRD. The couple's own theme, Open Graph image, icons and table cards all need the domain, colours and photos.

See: [Open questions](../docs/prd.md#open-questions) · [How theming works](../docs/prd.md#how-theming-works).

## Scope

- Pick the domain name (to buy in TICKET-146).
- Pick 1–2 wedding colours.
- Supply a hero photo (at least 2400px wide) and a square photo for icons and previews, with rights to publish.

## Out of scope

- Building the theme (TICKET-014).

## Acceptance criteria

- [ ] Domain name, hex colours and photo files are recorded in notes (photos in a shared folder linked from notes).
- [ ] Photo usage is agreed with both partners.

- [ ] The primary palette is already selected: ivory, champagne gold and chocolate brown. Record that decision; only domain, photos and asset permissions still require approval.

## Test plan

- Manual: Couple decides; agent records.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: confirm supplied photo rights and domain ownership; do not reopen the approved palette.

## Files likely touched

- `tickets/ (notes only)`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
