---
id: TICKET-175
title: Validate and store invitation photo uploads
epic: admin
status: in_review
priority: medium
estimate: M
labels: [backend, security]
module: admin
owner: divine
agent: codex
blocked_by: [TICKET-088]
blocks: [TICKET-099, TICKET-178]
branch: TICKET-175
pr: https://github.com/UncleChenna/wedding-app/pull/107
created: 2026-10-21
updated: 2026-11-06
started: 2026-11-06
completed: ""
reason: ""
resume_to: ""
---

# TICKET-175: Validate and store invitation photo uploads

## Context

Backlog audit coverage: ADM-5, THM-1. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Separate the image upload pipeline from the invitation editor.

## Out of scope

- Work outside the stated contract; consuming screens and launch operations remain in their linked tickets. No product implementation is part of this audit.

## Acceptance criteria

- [x] Admin-only upload validates decoded image bytes, MIME, dimensions and explicit size bounds, rejects polyglot/invalid files, strips EXIF and corrects orientation.
- [x] Store only approved image types and return a controlled asset reference with dimensions and blur placeholder; arbitrary external URLs are rejected.
- [x] Document storage access and retention; any storage/RLS policy change receives the approval required by AGENTS.md.

## Test plan

- Unit: malformed, oversized and mismatched-type fixtures. Integration: unauthorized upload fails; approved upload decodes correctly, strips EXIF and produces a usable placeholder.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- src/modules/admin/server/; src/modules/shared/server/

## Notes / decisions

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.
- 2026-11-06 — Decoder, authorized raw upload, private retrieval and bounded Drizzle storage implemented. Quick checks, production build, two isolated migration runs/RLS checks, persistence integration and real mobile/desktop OTP/TOTP upload tests pass. Migration commit authorization remains pending; full verification is not green because three hook tests encounter the unauthorized journal. See docs/handoffs/TICKET-175.md and docs/reviews/TICKET-175/migration-approval.md. No production application or public photo access is authorized.

## Activity log

- 2026-10-21 — new → todo — divine
- 2026-11-06 — todo → claimed — divine (codex)
- 2026-11-06 — todo → in_progress — divine (codex)
- 2026-11-06 — in_progress → blocked — divine (codex) — Photo upload implemented; migration commit and exact-path authorization pending for 0013_invitation-photos SQL/snapshot/journal. Build, isolated DB and real authenticated upload tests pass; full gate blocked by protected-file hook tests.
- 2026-11-06 — blocked → in_progress — divine (codex) — User approved exact migration commit paths and authorization record
- 2026-11-06 — User approved the exact generated migration paths and authorization record. Full verification now passes:1054 unit tests,837 browser smoke tests; separate real admin upload and database integration checks pass. Prior hook failures cleared without hook/test changes. No production database application authorized.
- 2026-11-06 — in_progress → in_review — divine (codex)
- 2026-11-06 — in_review → blocked — divine (codex) — Develop 6fb46534 adds another migration0013; explicit base update, generator reconciliation and isolated reset approval pending. Original-base full verification and implementation are pushed in PR107.
- 2026-11-06 — blocked → in_review — divine (codex) — Integration approval received; restoring prior status before addressing review changes
- 2026-11-06 — in_review → in_progress — divine (codex) — Apply user-approved develop integration and migration reconciliation
