---
id: WED-068
title: Sync check-ins across scanners within two seconds
epic: checkin
status: todo
priority: high
estimate: M
labels: [frontend, backend]
module: checkin
owner: ""
agent: ""
blocked_by: [WED-033, WED-061, WED-065]
blocks: [WED-137, WED-154]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-068: Sync check-ins across scanners within two seconds

## Context

CHK-7 (Should): several scanners at once, check-ins visible across all devices within 2 seconds.

See: [Gate check-in](../docs/prd.md#gate-check-in) (CHK-7).

## Scope

- Subscribe to check-in events and update the local cache.
- Fallback polling when realtime drops.

## Out of scope

- Offline merge (WED-066).

## Acceptance criteria

- [ ] An admission on device A shows as used on device B within 2s (e2e with two contexts).
- [ ] With realtime blocked, polling updates within 15s.

## Test plan

- End-to-end: Two-context timing test.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/checkin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
