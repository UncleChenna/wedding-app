---
id: TICKET-174
title: Add the admin scan log and dispute filters
epic: admin
status: done
priority: medium
estimate: M
labels: [frontend, backend]
module: admin
owner: divine
agent: codex
blocked_by: [TICKET-062, TICKET-088]
blocks: [TICKET-154]
branch: TICKET-174
pr: https://github.com/UncleChenna/wedding-app/pull/157
created: 2026-10-21
updated: 2026-11-12
started: 2026-11-09
completed: 2026-11-12
reason: ""
resume_to: ""
---

# TICKET-174: Add the admin scan log and dispute filters

## Context

Backlog audit coverage: CHK-5, ADM-3. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Provide the scan-log UI removed from the event writer ticket.

## Out of scope

- Changing original scan evidence or admission counts, offline queue/sync implementation, and launch operations remain in their linked tickets.

## Acceptance criteria

- [x] Admin can filter scan attempts by invitation, time, staff, device and all five results, including unknown-token attempts.
- [x] Manual entry is a source field, not a sixth scan result; online and reconciled offline attempts appear with separate reported/received timestamps.
- [x] Dispute annotations preserve immutable original evidence and never expose PINs, tokens or dietary notes; unauthorized roles cannot read the log.

## Test plan

- Integration: authorization and filter fixtures for all results. End-to-end: filter a synced offline conflict and add a resolution note without changing original evidence.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- src/modules/admin/; src/modules/checkin/

## Notes / decisions

- 2026-11-10: Additive scan-log migrations and 19 real database/seed checks pass; retry review fixes are verified. Authenticated CI now passes all six browser cases and seven scan-log SQL tests, including explicit all-theme axe/target checks. Final-head full CI remains required. See the ticket handoff.

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.

## Activity log

- 2026-10-21 — new → todo — divine
- 2026-11-09 — todo → claimed — divine (codex) — started ahead of TICKET-062 (in_review)
- 2026-11-09 — todo → in_progress — divine (codex) — started ahead of TICKET-062 (in_review)
- 2026-11-10 — in_progress → in_review — divine (codex)
- 2026-11-11 — in_review → in_progress — divine (codex) — Merged PR151 retains failing admin navigation assertion; repair and verify integrated develop before completion
- 2026-11-11 — in_progress → in_review — divine (codex)
- 2026-11-12 — in_review → done — divine (codex)
