---
id: WED-060
title: Show scan results within one second with sound and vibration
epic: checkin
status: todo
priority: urgent
estimate: M
labels: [frontend]
module: checkin
owner: ""
agent: ""
blocked_by: [WED-058, WED-059]
blocks: [WED-061, WED-118]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-060: Show scan results within one second with sound and vibration

## Context

Staff need Valid (green), Already used (amber) and Invalid (red) at arm's length in under a second; success also beeps and vibrates where allowed.

See: [Gate check-in](../docs/prd.md#gate-check-in) (CHK-2) · [Journey 2: check-in at the gate](../docs/prd.md#journey-2-check-in-at-the-gate) · [Design principles (repo)](../docs/design-principles.md) · [On the website](../docs/prd.md#on-the-website).

## Scope

- Result panels with name, party size, table, admitted so far, and who/when/which device for used codes.
- "Welcome, {GuestName}. Table {N} is ready for you."
- Sound and vibration when supported; graceful when blocked.

## Out of scope

- Admitting (WED-061).

## Acceptance criteria

- [ ] Scan-to-result is <1s with a cached list (Playwright timing on fixture).
- [ ] Each result has text + icon; meaning does not rely on colour.
- [ ] Blocked audio/vibration never hides or delays the visual result (unit with stubbed APIs).

## Test plan

- Unit: Feedback helpers with stubs.
- End-to-end: Each result type.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/checkin/components/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
