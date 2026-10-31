---
id: TICKET-037
title: Build the IV page with names, date, venue, dress code and map
epic: invitations
status: done
priority: urgent
estimate: L
labels: [frontend, design]
module: invitations
owner: divine
agent: codex
blocked_by: [TICKET-015, TICKET-017, TICKET-025, TICKET-036, TICKET-021]
blocks: [TICKET-038, TICKET-039, TICKET-047]
branch: TICKET-037
pr: https://github.com/UncleChenna/wedding-app/pull/57
created: 2026-10-21
updated: 2026-10-31
started: 2026-10-31
completed: 2026-10-31
reason: ""
resume_to: ""
---

# TICKET-037: Build the IV page with names, date, venue, dress code and map

## Context

The IV is the hero: it should feel like a printed invitation that happens to be alive, readable at 375px inside WhatsApp's browser.

See: [Journey 1: receiving the IV and RSVP](../docs/prd.md#journey-1-receiving-the-iv-and-rsvp) · [Design principles](../docs/prd.md#design-principles) · [On the website](../docs/prd.md#on-the-website).

## Scope

- Sections: headline, couple names, date/time, venue with map link, dress code, RSVP call to action near the bottom.
- PRD copy (IV headline and sub-line).
- Server Component; no client JS except where interactive.

## Out of scope

- Hero photo (TICKET-038), envelope reveal (TICKET-039), RSVP form (TICKET-040).

## Acceptance criteria

- [x] Automated UI checks and inspected screenshots pass at 375/768/1280 in every theme. Owner-approved exceptions for physical-device/native-map verification and performance consistency are mandatory release gates in TICKET-201; actual results remain disclosed.
- [x] A configured HTTPS map destination is rendered and validated; missing/unsafe destinations are omitted. Physical native-map handoff is explicitly retained in TICKET-201 under the owner-approved exception.
- [x] The RSVP action is within thumb reach at 375px and never covered by sticky UI.

- [x] An 80-character couple or guest name wraps without clipping at 375px. When supplied with issued-pass content, the layout provides a direct anchor to that rendered section; signed-pass issuance and returning-guest integration are verified in TICKET-044.

## Test plan

- End-to-end: Render test per theme; overflow check at 375px.
- Manual: Open in WhatsApp in-app browser on one phone.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: End-to-end: first/return visit, long names, keyboard and reduced-motion screenshots.

## Files likely touched

- `src/modules/invitations/components/`
- `src/app/(guest)/i/[token]/`

## Notes / decisions

2026-10-31: Owner explicitly approved review with device/native-map checks and performance variability retained in release-blocking TICKET-201. Scores remain94/98/95 in serial testing, not a blanket performance pass. Full verification passes (471 unit,525 browser); all12 preview and60 live screenshots inspected. PR57 is ready for the review transition, not guest release.

2026-10-31: Owner explicitly approved splitting the returning-pass requirement into TICKET-044. This ticket provides the content slot and matching anchor only; it never fabricates a pass or dead link. The real returning-guest requirement remains mandatory in TICKET-044 and is not declared delivered here.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-31 — todo → claimed — divine (codex)
- 2026-10-31 — todo → in_progress — divine (codex)
- 2026-10-31 — in_progress → in_review — divine (codex)
- 2026-10-31 — in_review → done — divine (codex)
