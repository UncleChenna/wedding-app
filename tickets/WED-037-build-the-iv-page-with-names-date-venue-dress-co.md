---
id: WED-037
title: Build the IV page with names, date, venue, dress code and map
epic: invitations
status: todo
priority: high
estimate: L
labels: [frontend, design]
module: invitations
owner: ""
agent: ""
blocked_by: [WED-015, WED-017, WED-025, WED-036]
blocks: [WED-038, WED-039, WED-047]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-037: Build the IV page with names, date, venue, dress code and map

## Context

The IV is the hero: it should feel like a printed invitation that happens to be alive, readable at 375px inside WhatsApp's browser.

See: [Journey 1: receiving the IV and RSVP](../docs/prd.md#journey-1-receiving-the-iv-and-rsvp) · [Design principles](../docs/prd.md#design-principles) · [On the website](../docs/prd.md#on-the-website).

## Scope

- Sections: headline, couple names, date/time, venue with map link, dress code, RSVP call to action near the bottom.
- PRD copy (IV headline and sub-line).
- Server Component; no client JS except where interactive.

## Out of scope

- Hero photo (WED-038), envelope reveal (WED-039), RSVP form (WED-040).

## Acceptance criteria

- [ ] UI checklist passes with evidence at 375/768/1280 in every theme.
- [ ] Map link opens the venue in the native maps app (geo/https link).
- [ ] The RSVP action is within thumb reach at 375px and never covered by sticky UI.

## Test plan

- End-to-end: Render test per theme; overflow check at 375px.
- Manual: Open in WhatsApp in-app browser on one phone.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/invitations/components/`
- `src/app/(guest)/i/[token]/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
