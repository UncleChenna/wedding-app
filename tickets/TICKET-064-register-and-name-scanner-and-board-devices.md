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

- [x] A device keeps its id across reloads and offline periods.
- [x] Renaming a device updates the name shown on new results.

## Test plan

- Unit: Device id persistence.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/checkin/`
- `src/modules/shared/`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-05 (unclechenna, claude):
  - **Device id:** the signed 64-hex `staff_device` cookie, set on first PIN sign-in and kept for 90 days. It survives
    reloads, sign-out and offline periods, because the device needs no network to keep it. `registered_devices` holds
    one row per id.
  - **Renaming:** `/admin/staff` has a Devices section to rename each device. Every staff screen reads the name fresh
    ("This device is Kitchen tablet 1.").
  - **Still to come:** the gate's "already used" result and the scan log are built in TICKET-061 and TICKET-062. They
    read `registered_devices.name` by id.
  - **Tests:** the id tests are in `e2e/admin-staff.spec.ts`, which checks the same id after a reload and a fresh
    sign-in. `device.test.ts` covers name and id validation.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-05 — todo → claimed — unclechenna (claude)
- 2026-11-05 — todo → in_progress — unclechenna (claude)
