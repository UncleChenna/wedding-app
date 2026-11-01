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

- [x] Implement the approved TICKET-169 URL contract: signed pass resolution provides read-only display and cannot authorize invitation editing.
- [x] Reject forged, expired, revoked, reissued and no-longer-eligible passes online with privacy-safe states; do not leak guest names or raw credentials into metadata, logs or analytics.
- [x] Use realistic signed token lengths in generated QR tests and distinguish online eligibility from stale offline evidence.

## Test plan

- Integration: signature/version/status/expiry matrix and negative edit-authority tests. End-to-end: scan a generated pass URL, open it on another browser and verify it cannot edit RSVP.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- src/modules/invitations/; src/app/(guest)/; e2e/

## Notes / decisions

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.
- 2026-11-01:
  - **Module.** The pass logic lives in `checkin`, not `invitations`: it uses checkin's signing keys, and modules
    may not import another feature's server code. The guest route calls it.
  - **"Expired".** ADR 0020 gives passes no lifetime of their own. Online, these read as `invalid`:
    - a pass dated more than 10 minutes in the future
    - a pass whose key has been removed from the ring
    - a pass whose invitation has been deleted (retention, TICKET-127)

    Device and session expiry belong to the scanner (TICKET-057, TICKET-065).
  - **Online vs offline.** `PassResolution` is documented as current-server eligibility. It never claims admission;
    offline scanners follow ADR 0020's stale-list rules.
  - **QR size.** A worst-case real pass URL is QR version 12 (65 modules). It decodes in every theme with jsQR;
    camera scanning on real devices is still unverified.
  - **Not run here.** The database integration test is opt-in (`RUN_INVITATION_DB_TESTS=1`) and wasn't run,
    because local Docker was unresponsive. No live browser test of a valid signed pass was run either: it needs
    signing keys and a database.

## Activity log

- 2026-10-21 — new → todo — divine
- 2026-11-01 — todo → claimed — unclechenna (claude)
- 2026-11-01 — todo → in_progress — unclechenna (claude)
