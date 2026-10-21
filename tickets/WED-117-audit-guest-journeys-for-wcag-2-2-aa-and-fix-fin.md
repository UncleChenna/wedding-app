---
id: WED-117
title: Audit guest journeys for WCAG 2.2 AA and fix findings
epic: quality
status: todo
priority: high
estimate: L
labels: [frontend, test]
module: invitations
owner: ""
agent: ""
blocked_by: [WED-041, WED-044, WED-075, WED-115]
blocks: [WED-164]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-117: Audit guest journeys for WCAG 2.2 AA and fix findings

## Context

Guests use older phones, screen readers and zoom; the IV, RSVP, pass and order flows must meet AA.

See: [Usability and accessibility](../docs/prd.md#usability-and-accessibility).

## Scope

- Keyboard, VoiceOver/TalkBack, 200% zoom, reduced motion, contrast in all themes.
- Fix findings or file tickets.

## Out of scope

- Staff/admin (WED-118).

## Acceptance criteria

- [ ] Audit report in docs/audits/ with every finding and its fix or ticket.
- [ ] No open serious finding on guest pages.

## Test plan

- Manual: Screen reader passes on iOS and Android.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/audits/`
- `src/modules/invitations/`
- `src/modules/ordering/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
