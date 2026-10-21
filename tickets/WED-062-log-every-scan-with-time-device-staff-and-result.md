---
id: WED-062
title: Log every scan with time, device, staff and result
epic: checkin
status: todo
priority: high
estimate: S
labels: [backend]
module: checkin
owner: ""
agent: ""
blocked_by: [WED-061]
blocks: [WED-132]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-062: Log every scan with time, device, staff and result

## Context

CHK-5: every scan, including invalid ones, is logged for disputes on the day.

See: [Gate check-in](../docs/prd.md#gate-check-in) (CHK-5).

## Scope

- scan_log write on every scan result, online or synced later.
- Admin view filter by result and device.

## Out of scope

- Analytics.

## Acceptance criteria

- [ ] Each of the five result types produces exactly one log row (unit).
- [ ] Offline scans are logged with their device time when synced.

## Test plan

- Unit: Logging per result.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/checkin/server/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
