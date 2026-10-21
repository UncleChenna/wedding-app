---
id: WED-064
title: Register and name scanner and board devices
epic: checkin
status: todo
priority: medium
estimate: S
labels: [backend, frontend]
module: checkin
owner: ""
agent: ""
blocked_by: [WED-031, WED-088]
blocks: [WED-061, WED-062]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-064: Register and name scanner and board devices

## Context

"Already used" must say which device admitted the guest; staff need human-readable device names.

See: [Journey 2: check-in at the gate](../docs/prd.md#journey-2-check-in-at-the-gate) · [Gate check-in](../docs/prd.md#gate-check-in) (CHK-5).

## Scope

- Device id generated and stored on first PIN sign-in; admin can name it.
- Device name shown on used results and in the scan log.

## Out of scope

- MDM or device management.

## Acceptance criteria

- [ ] A device keeps its id across reloads and offline periods.
- [ ] Renaming a device updates the name shown on new results.

## Test plan

- Unit: Device id persistence.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/checkin/`
- `src/modules/shared/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
