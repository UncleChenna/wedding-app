---
id: TICKET-064
title: Register and name scanner and board devices
epic: checkin
status: in_progress
priority: medium
estimate: S
labels: [backend, frontend]
module: checkin
owner: unclechenna
agent: claude
blocked_by: [TICKET-031, TICKET-088]
blocks: [TICKET-061, TICKET-062]
branch: TICKET-064
pr: ""
created: 2026-10-21
updated: 2026-11-05
started: 2026-11-05
completed: ""
reason: ""
resume_to: ""
---

# TICKET-064: Register and name scanner and board devices

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
- 2026-11-05 — todo → claimed — unclechenna (claude)
- 2026-11-05 — todo → in_progress — unclechenna (claude)
