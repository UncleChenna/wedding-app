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
blocked_by: [WED-061, WED-064]
blocks: [WED-063, WED-066, WED-132, WED-136, WED-174]
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

- Write online scan attempts with staff/device, result and reported/server timestamps. WED-066 queues offline events; WED-173 merges them; WED-174 supplies admin filtering.

## Out of scope

- Analytics.

## Acceptance criteria

- [ ] Each of the five online results creates a log row, including unknown tokens with no invitation id.
- [ ] Manual lookup is recorded as the source while preserving the result vocabulary.
- [ ] Staff identifiers are recorded without raw PINs, pass tokens or dietary notes; unauthorized log reads fail.

## Test plan

- Unit: Logging per result.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/checkin/server/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
