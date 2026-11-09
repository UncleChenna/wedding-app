---
id: TICKET-060
title: Show scan results within one second with sound and vibration
epic: checkin
status: in_review
priority: high
estimate: M
labels: [frontend]
module: checkin
owner: divine
agent: codex
blocked_by: [TICKET-058, TICKET-059, TICKET-093]
blocks: [TICKET-061, TICKET-118]
branch: TICKET-060
pr: https://github.com/UncleChenna/wedding-app/pull/139
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-060: Show scan results within one second with sound and vibration

## Context

Staff need Valid (green), Already used (amber) and Invalid (red) at arm's length in under a second; success also beeps and vibrates where allowed.

See: [Gate check-in](../docs/prd.md#gate-check-in) (CHK-2) · [Journey 2: check-in at the gate](../docs/prd.md#journey-2-check-in-at-the-gate) · [Design principles (repo)](../docs/design-principles.md) · [On the website](../docs/prd.md#on-the-website).

## Scope

- Result panels with name, party size, table, admitted so far, and who/when/which device for used codes.
- "Welcome, {GuestName}. Table {N} is ready for you."
- Sound and vibration when supported; graceful when blocked.

## Out of scope

- Admitting (TICKET-061).

## Acceptance criteria

- [x] Scan-to-result is <1s with a cached list (Playwright timing on fixture).
- [x] Each result has text + icon; meaning does not rely on colour.
- [x] A household assigned or reassigned in TICKET-093 shows its current table on the scanner result; an unassigned household shows a clear fallback (e2e).
- [x] Blocked audio/vibration never hides or delays the visual result (unit with stubbed APIs).

## Test plan

- Unit: Feedback helpers with stubs.
- End-to-end: Each result type.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/checkin/components/`

## Notes / decisions

- 2026-11-09 — Carries the scanner-display end-to-end requirement from TICKET-093. Seating is implemented first; this check remains mandatory before scanner completion.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — divine (codex) — started ahead of TICKET-059 (in_progress)
- 2026-11-09 — todo → in_progress — divine (codex) — started ahead of TICKET-059 (in_progress)
- 2026-11-09 — in_progress → blocked — divine (codex) — Awaiting TICKET-059 merge; its CI is blocked by newly merged scan-sync coverage. Draft PR139 foundation preserved; shared coverage repair takes priority.
- 2026-11-09 — blocked → in_progress — divine (codex) — TICKET-059 verified merged; resume authorized scanner results and integration.
- 2026-11-09 — in_progress → in_review — divine (codex)
