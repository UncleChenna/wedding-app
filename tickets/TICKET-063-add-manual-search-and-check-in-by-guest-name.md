---
id: TICKET-063
title: Add manual search and check-in by guest name
epic: checkin
status: in_progress
priority: high
estimate: M
labels: [frontend, backend]
module: checkin
owner: divine
agent: codex
blocked_by: [TICKET-061, TICKET-065, TICKET-062]
blocks: [TICKET-132, TICKET-136]
branch: TICKET-063
pr: ""
created: 2026-10-21
updated: 2026-11-10
started: 2026-11-10
completed: ""
reason: ""
resume_to: ""
---

# TICKET-063: Add manual search and check-in by guest name

## Context

Guests without a phone are found by name and checked in manually.

See: [Gate check-in](../docs/prd.md#gate-check-in) (CHK-4) · [Journey 2: check-in at the gate](../docs/prd.md#journey-2-check-in-at-the-gate).

## Scope

- Accent- and typo-tolerant search over primary and tag-along names (works offline from the cache).
- Same admission flow and logging as a scan.

## Out of scope

- Editing guests at the gate.

## Acceptance criteria

- [ ] Searching "Adebayo", "adebayo" and "Adébayo" finds the same guest (unit).
- [ ] Manual checks and admissions retain the five canonical verdicts and record `input_method=manual`; actor/device come from the authenticated gate session.
- [ ] Results are readable at arm's length (≥18px).
- [ ] Replace TICKET-059’s interim manual-help link with authenticated name search. With camera permission denied, a gate operator can follow that link, find a primary guest or tag-along and complete the same logged admission flow, including offline cached search.

## Test plan

- Unit: Search normalisation.
- End-to-end: Search and admit.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/checkin/`

## Notes / decisions

2026-11-09: Carries the mandatory manual-search recovery link from TICKET-059, whose camera foundation precedes these admission/cache dependencies. CHK-4 is not waived; release journeys TICKET-132 and TICKET-136 remain blocked on this full implementation.

2026-11-10: Clarified stale manual-result wording to TICKET-062's input-method contract. This ticket includes offline cached search/read and current online admission; TICKET-066 retains offline mutation, outbox and sync. Cached results do not claim entry was recorded and require fresh online selection before admission. Both dependencies remain incomplete until merged; keep this PR draft while working ahead.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-10 — todo → claimed — divine (codex) — started ahead of TICKET-065 (in_review), TICKET-062 (in_review)
- 2026-11-10 — todo → in_progress — divine (codex) — started ahead of TICKET-065 (in_review), TICKET-062 (in_review)
