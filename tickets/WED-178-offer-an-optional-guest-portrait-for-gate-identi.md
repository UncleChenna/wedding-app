---
id: WED-178
title: Offer an optional guest portrait for gate identification
epic: invitations
status: backlog
priority: low
estimate: M
labels: [frontend, backend]
module: invitations
owner: ""
agent: ""
blocked_by: [WED-040, WED-175]
blocks: []
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-178: Offer an optional guest portrait for gate identification

## Context

Backlog audit coverage: CHK journey optional guest photo. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Track the optional identification portrait explicitly as backlog work, disabled by default.

## Out of scope

- Work outside the stated contract; consuming screens and launch operations remain in their linked tickets. No product implementation is part of this audit.

## Acceptance criteria

- [ ] Obtain owner approval and explicit guest consent before enabling optional portrait upload; declining has no effect on RSVP or admission.
- [ ] Reuse validated image processing with guest capability authorization; a guest cannot overwrite another portrait and only authorized gate/admin roles see it.
- [ ] Apply expiry/deletion and private-cache rules to portraits; names/manual lookup remain the fallback and no face recognition is introduced.

## Test plan

- Integration: consent, ownership, deletion and unauthorized access tests. Manual: verify no-photo and offline fallback on a gate device; record activation decision.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- src/modules/invitations/; src/modules/checkin/

## Notes / decisions

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.

## Activity log

- 2026-10-21 — new → backlog — divine
