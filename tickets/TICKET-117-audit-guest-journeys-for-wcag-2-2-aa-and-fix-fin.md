---
id: TICKET-117
title: Audit guest journeys for WCAG 2.2 AA and fix findings
epic: quality
status: done
priority: high
estimate: L
labels: [frontend, test, human]
module: invitations
owner: divine
agent: codex
blocked_by: [TICKET-041, TICKET-044, TICKET-075, TICKET-115]
blocks: [TICKET-154, TICKET-164]
branch: TICKET-117
pr: https://github.com/UncleChenna/wedding-app/pull/183
created: 2026-10-21
updated: 2026-11-13
started: 2026-11-13
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

- [x] Audit report in docs/audits/ with every finding and its fix or ticket.
- [x] No open serious finding in the completed automated guest-page audit; physical screen-reader/device sign-off remains mandatory in release-blocking TICKET-201 under the approved preview disposition.

- [x] Scope this ticket to audit evidence and at most one bounded remediation per reviewed journey; create separate tickets for larger fixes and make release depend on their completion. All applicable A/AA findings must be resolved before release sign-off in TICKET-201.

## Test plan

- Manual: Screen reader passes on iOS and Android.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: keyboard/screen-reader checklist with reproducible findings, linked fixes and retest evidence.

## Files likely touched

- `docs/audits/`
- `src/modules/invitations/`
- `src/modules/ordering/`

## Notes / decisions

2026-11-13: Draft audit PR183 covers actual invitation/saved RSVP/issued pass, all4themes and320/375/768/1280widths, reducedmotion, keyboard and200%text. Oneheading wrapping fix changes baseline12/16pass to16/16;80axe scans reportzeroA/AA violations. Independent review clean. Native ordering subsequently passed all16cases; combined140axe scans pass. PhysicalVoiceOver/TalkBack and fullno-open-serious signoff remainunverified; exactreleasechecks retained inTICKET-201. See docs/audits/TICKET-117-guest-accessibility.md.

2026-11-13: Approved preview disposition applied: automated audit and two bounded journey fixes are complete; physical screen-reader/device checks and full manual conformance remain release-blocking TICKET-201, not represented as performed. Final base979609e6,32browser cases pass, reset unit passes, build and quick checks pass. Independent reviews clean.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
- 2026-11-13 — in_progress → in_review — divine (codex)
