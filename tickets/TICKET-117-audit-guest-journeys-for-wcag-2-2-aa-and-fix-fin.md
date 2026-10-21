---
id: TICKET-117
title: Audit guest journeys for WCAG 2.2 AA and fix findings
epic: quality
status: todo
priority: high
estimate: L
labels: [frontend, test, human]
module: invitations
owner: ""
agent: ""
blocked_by: [TICKET-041, TICKET-044, TICKET-075, TICKET-115]
blocks: [TICKET-154, TICKET-164]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-117: Audit guest journeys for WCAG 2.2 AA and fix findings

## Context

Guests use older phones, screen readers and zoom; the IV, RSVP, pass and order flows must meet AA.

See: [Usability and accessibility](../docs/prd.md#usability-and-accessibility).

## Scope

- Keyboard, VoiceOver/TalkBack, 200% zoom, reduced motion, contrast in all themes.
- Fix findings or file tickets.

## Out of scope

- Staff/admin (TICKET-118).

## Acceptance criteria

- [ ] Audit report in docs/audits/ with every finding and its fix or ticket.
- [ ] No open serious finding on guest pages.

- [ ] Scope this ticket to audit evidence and at most one bounded remediation per reviewed journey; create separate tickets for larger fixes and make release depend on their completion. All applicable A/AA findings must be resolved before sign-off.

## Test plan

- Manual: Screen reader passes on iOS and Android.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: keyboard/screen-reader checklist with reproducible findings, linked fixes and retest evidence.

## Files likely touched

- `docs/audits/`
- `src/modules/invitations/`
- `src/modules/ordering/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
