---
id: WED-177
title: Import and reconcile the real invitation guest list
epic: launch
status: todo
priority: urgent
estimate: S
labels: [human, db]
module: ops
owner: ""
agent: ""
blocked_by: [WED-091, WED-176, WED-034, WED-126]
blocks: [WED-157, WED-159]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-177: Import and reconcile the real invitation guest list

## Context

Backlog audit coverage: INV-1, invitation launch. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Load the real guest list for the invitation release, separately from the later menu load.

## Out of scope

- Work outside the stated contract; consuming screens and launch operations remain in their linked tickets. No product implementation is part of this audit.

## Acceptance criteria

- [ ] Import the owner-approved list through the validated importer, reconcile invite/guest totals and tag-along limits, and resolve duplicate/invalid rows before sending.
- [ ] Keep personal data out of git, screenshots and logs; record counts and an approved private source location only.
- [ ] Owner signs off names, contact channels, household grouping and first-send batch; import does not reset existing responses.

## Test plan

- Manual: reconcile private source counts to the admin export and sample household names; rehearse with synthetic CSV first. Unit: not applicable to the human import operation; importer tests are WED-182.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- Private launch checklist; no real guest data committed

## Notes / decisions

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.

## Activity log

- 2026-10-21 — new → todo — divine
