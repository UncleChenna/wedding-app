---
id: WED-182
title: Validate and commit guest CSV imports atomically
epic: admin
status: todo
priority: urgent
estimate: M
labels: [backend, test]
module: admin
owner: ""
agent: ""
blocked_by: [WED-090]
blocks: [WED-091]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-182: Validate and commit guest CSV imports atomically

## Context

Backlog audit coverage: INV-1, ADM-1. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Separate CSV parsing and transactional import from the preview UI.

## Out of scope

- Work outside the stated contract; consuming screens and launch operations remain in their linked tickets. No product implementation is part of this audit.

## Acceptance criteria

- [ ] Validate headers, row bounds, contacts, grouping and per-invitation tag-along limits with row-specific errors; malformed CSV cannot partially write.
- [ ] Document duplicate household/contact handling; repeated import uses a stable preview/commit identity and cannot create duplicate invitations.
- [ ] Commit an approved preview atomically, reject changed/stale inputs, preserve existing RSVP state, and neutralize spreadsheet formulas in exported cells.

## Test plan

- Unit: quoted commas/newlines, Unicode, missing headers, duplicates and formula cells. Integration: failed middle row rolls back all writes; double submission and concurrent commit do not duplicate guests.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- src/modules/admin/lib/; src/modules/admin/server/

## Notes / decisions

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.

## Activity log

- 2026-10-21 — new → todo — divine
