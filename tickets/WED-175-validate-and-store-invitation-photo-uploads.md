---
id: WED-175
title: Validate and store invitation photo uploads
epic: admin
status: todo
priority: medium
estimate: M
labels: [backend, security]
module: admin
owner: ""
agent: ""
blocked_by: [WED-088]
blocks: [WED-099, WED-178]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-175: Validate and store invitation photo uploads

## Context

Backlog audit coverage: ADM-5, THM-1. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Separate the image upload pipeline from the invitation editor.

## Out of scope

- Work outside the stated contract; consuming screens and launch operations remain in their linked tickets. No product implementation is part of this audit.

## Acceptance criteria

- [ ] Admin-only upload validates decoded image bytes, MIME, dimensions and explicit size bounds, rejects polyglot/invalid files, strips EXIF and corrects orientation.
- [ ] Store only approved image types and return a controlled asset reference with dimensions and blur placeholder; arbitrary external URLs are rejected.
- [ ] Document storage access and retention; any storage/RLS policy change receives the approval required by AGENTS.md.

## Test plan

- Unit: malformed, oversized and mismatched-type fixtures. Integration: unauthorized upload fails; approved upload decodes correctly, strips EXIF and produces a usable placeholder.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- src/modules/admin/server/; src/modules/shared/server/

## Notes / decisions

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.

## Activity log

- 2026-10-21 — new → todo — divine
