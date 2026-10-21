---
id: WED-174
title: Add the admin scan log and dispute filters
epic: admin
status: todo
priority: medium
estimate: M
labels: [frontend, backend]
module: admin
owner: ""
agent: ""
blocked_by: [WED-062, WED-088]
blocks: [WED-154]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-174: Add the admin scan log and dispute filters

## Context

Backlog audit coverage: CHK-5, ADM-3. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Provide the scan-log UI removed from the event writer ticket.

## Out of scope

- Work outside the stated contract; consuming screens and launch operations remain in their linked tickets. No product implementation is part of this audit.

## Acceptance criteria

- [ ] Admin can filter scan attempts by invitation, time, staff, device and all five results, including unknown-token attempts.
- [ ] Manual entry is a source field, not a sixth scan result; online and reconciled offline attempts appear with separate reported/received timestamps.
- [ ] Dispute annotations preserve immutable original evidence and never expose PINs, tokens or dietary notes; unauthorized roles cannot read the log.

## Test plan

- Integration: authorization and filter fixtures for all results. End-to-end: filter a synced offline conflict and add a resolution note without changing original evidence.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- src/modules/admin/; src/modules/checkin/

## Notes / decisions

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.

## Activity log

- 2026-10-21 — new → todo — divine
