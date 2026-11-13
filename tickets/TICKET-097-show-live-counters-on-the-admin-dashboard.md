---
id: TICKET-097
title: Show live counters on the admin dashboard
epic: admin
status: done
priority: high
estimate: M
labels: [frontend, backend]
module: admin
owner: divine
agent: codex
blocked_by: [TICKET-033, TICKET-061, TICKET-072, TICKET-089]
blocks: [TICKET-154]
branch: TICKET-097
pr: https://github.com/UncleChenna/wedding-app/pull/146
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-097: Show live counters on the admin dashboard

## Context

ADM-3: invited, RSVP'd yes, arrived, orders open/served on one screen.

See: [Admin dashboard](../docs/prd.md#admin-dashboard) (ADM-3) · [Overview and goals](../docs/prd.md#overview-and-goals).

## Scope

- Counter tiles with live updates; arrivals in people, not invitations.

## Out of scope

- Charts.

## Acceptance criteria

- [x] Counters match DB queries in a unit test on seed data.
- [x] An admission updates 'arrived' within 2s (e2e).

## Test plan

- Unit: Counter queries.
- End-to-end: Live update.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

- 2026-11-09 — Two isolated database fixtures verify aggregate semantics; authenticated mobile/desktop browser tests measure arrival updates at 993.8ms/994.9ms. All seven CI jobs pass on `95aaf252` (run42713917024), and independent review covers source and all42 screenshots. The ticket remains in progress and PR146 draft: TICKET-061 must merge, then the combined base must pass verification. Physical-device completion is not claimed.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — divine (codex) — started ahead of TICKET-061 (in_progress)
- 2026-11-09 — todo → in_progress — divine (codex) — started ahead of TICKET-061 (in_progress)
- 2026-11-09 — in_progress → in_review — divine (codex)
