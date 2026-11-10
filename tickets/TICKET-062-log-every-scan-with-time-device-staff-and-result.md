---
id: TICKET-062
title: Log every scan with time, device, staff and result
epic: checkin
status: done
priority: high
estimate: S
labels: [backend]
module: checkin
owner: divine
agent: codex
blocked_by: [TICKET-061, TICKET-064]
blocks: [TICKET-063, TICKET-066, TICKET-132, TICKET-136, TICKET-174]
branch: TICKET-062
pr: https://github.com/UncleChenna/wedding-app/pull/149
created: 2026-10-21
updated: 2026-11-10
started: 2026-11-09
completed: 2026-11-10
reason: ""
resume_to: ""
---

# TICKET-062: Log every scan with time, device, staff and result

## Context

CHK-5: every scan, including invalid ones, is logged for disputes on the day.

See: [Gate check-in](../docs/prd.md#gate-check-in) (CHK-5).

## Scope

- Write online scan attempts with staff/device, result and reported/server timestamps. TICKET-066 queues offline events; TICKET-173 merges them; TICKET-174 supplies admin filtering.

## Out of scope

- Analytics.

## Acceptance criteria

- [x] Each of the five online results creates a log row, including unknown tokens with no invitation id.
- [x] Manual lookup is recorded as the source while preserving the result vocabulary.
- [x] Staff identifiers are recorded without raw PINs, pass tokens or dietary notes; unauthorized log reads fail.

## Test plan

- Unit: Logging per result.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/checkin/server/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — divine (codex)
- 2026-11-09 — todo → in_progress — divine (codex)
- 2026-11-09 — Implemented and verified zero-person observations; manual input is separate from transport (ADR0025). Evidence and remaining full CI gate: `docs/plans/TICKET-062-pr.md`, draft PR149.
- 2026-11-09 — in_progress → in_review — divine (codex)
- 2026-11-09 — in_review → in_progress — divine (codex) — Preserve append-only scan evidence in existing scanner fixture cleanup after CI FK failure
- 2026-11-10 — in_progress → in_review — divine (codex)
- 2026-11-10 — in_review → done — divine (codex)
