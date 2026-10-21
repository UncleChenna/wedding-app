---
id: WED-169
title: Approve offline freshness and the gate credential contract
epic: checkin
status: todo
priority: urgent
estimate: S
labels: [human, security, docs]
module: checkin
owner: ""
agent: ""
blocked_by: []
blocks: [WED-031, WED-056, WED-108, WED-161]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-169: Approve offline freshness and the gate credential contract

## Context

Backlog audit coverage: CHK-6, INV-2, INV-7. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Record the gate credential and offline trust decisions before implementing signing.

## Out of scope

- Work outside the stated contract; consuming screens and launch operations remain in their linked tickets. No product implementation is part of this audit.

## Acceptance criteria

- [ ] Record an owner-approved decision on QR URLs: the PRD says an IV link, while the proposed signed /p route is read-only. Update the contract or PRD explicitly; do not silently grant RSVP editing from a pass.
- [ ] Approve snapshot maximum age, device/session expiry, lost-device response, clock-skew allowance, and stale revocation wording. Disconnected devices cannot learn new revocations immediately.
- [ ] Specify what RSVP party-size edits and reissues do to previously signed passes, and how staff handle excess admissions from disconnected devices.

## Test plan

- Manual: review a decision table covering fresh/stale snapshots, revoked/reissued passes, expiry, changed party size, and two disconnected scanners. Capture the named owner and decision date; unresolved choices keep the ticket open.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- docs/decisions/; docs/prd.md

## Notes / decisions

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.

## Activity log

- 2026-10-21 — new → todo — divine
