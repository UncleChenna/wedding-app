---
id: TICKET-183
title: Resolve signed pass URLs without exposing invitation editing
epic: invitations
status: in_progress
priority: urgent
estimate: M
labels: [backend, security]
module: invitations
owner: unclechenna
agent: claude
blocked_by: [TICKET-036, TICKET-040, TICKET-056]
blocks: [TICKET-044, TICKET-176, TICKET-185]
branch: TICKET-183
pr: ""
created: 2026-10-21
updated: 2026-11-01
started: 2026-11-01
completed: ""
reason: ""
resume_to: ""
---

# TICKET-183: Resolve signed pass URLs without exposing invitation editing

## Context

Backlog audit coverage: INV-2, INV-5, CHK-1. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Make the signed QR destination explicit instead of assuming a pass page already exists.

## Out of scope

- Work outside the stated contract; consuming screens and launch operations remain in their linked tickets. No product implementation is part of this audit.

## Acceptance criteria

- [ ] Implement the approved TICKET-169 URL contract: signed pass resolution provides read-only display and cannot authorize invitation editing.
- [ ] Reject forged, expired, revoked, reissued and no-longer-eligible passes online with privacy-safe states; do not leak guest names or raw credentials into metadata, logs or analytics.
- [ ] Use realistic signed token lengths in generated QR tests and distinguish online eligibility from stale offline evidence.

## Test plan

- Integration: signature/version/status/expiry matrix and negative edit-authority tests. End-to-end: scan a generated pass URL, open it on another browser and verify it cannot edit RSVP.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- src/modules/invitations/; src/app/(guest)/; e2e/

## Notes / decisions

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.

## Activity log

- 2026-10-21 — new → todo — divine
- 2026-11-01 — todo → claimed — unclechenna (claude)
- 2026-11-01 — todo → in_progress — unclechenna (claude)
