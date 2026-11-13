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
blocks: [TICKET-014, TICKET-145, TICKET-038]
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

Open question in the PRD. Final invitation publication needs the chosen domain and approved assets. Theme implementation and identified stock previews can proceed using the already approved palette.

See: [Open questions](../docs/prd.md#open-questions) · [How theming works](../docs/prd.md#how-theming-works).

## Scope

- Pick the domain name and intended registrant (purchase and ownership/DNS evidence belong to TICKET-146).
- Pick 1–2 wedding colours.
- Supply a hero photo (at least 2400px wide) and a square photo for icons and previews, with rights to publish.

## Out of scope

- Building the theme (TICKET-014).

## Acceptance criteria

- [ ] Domain name, hex colours and photo files are recorded in notes (photos in a shared folder linked from notes).
- [ ] Photo usage is agreed with both partners.
- [ ] Record both partners’ final visual approval of the TICKET-014 theme screenshots at 375/768/1280 and the final invitation photo presentation before release.

- [x] The primary palette is already selected: ivory, champagne gold and chocolate brown. Record that decision; domain, photos, asset permissions and final visual approval still require approval.

## Test plan

- Manual: Couple decides; agent records.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: confirm supplied photo rights, final visual approval and domain choice; TICKET-146 records actual ownership after purchase. Do not reopen the approved palette.

## Files likely touched

- `tickets/ (notes only)`

## Notes / decisions

- 2026-11-13 — TICKET-236: The approved colours are ivory #FFF9EF, champagne #D6BE8D and chocolate #432B22. TICKET-014 implements them; TICKET-038 may use an identified stock preview. Neither satisfies final asset/rights approval. TICKET-154 and TICKET-176 directly retain this release gate.

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
