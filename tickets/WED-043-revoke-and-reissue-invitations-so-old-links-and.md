---
id: WED-043
title: Revoke and reissue invitations so old links and QRs stop working
epic: invitations
status: todo
priority: high
estimate: M
labels: [backend, security]
module: invitations
owner: ""
agent: ""
blocked_by: [WED-036, WED-056]
blocks: [WED-065]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-043: Revoke and reissue invitations so old links and QRs stop working

## Context

INV-7: the admin can revoke or reissue an IV and the old QR stops working immediately, including on offline scanners.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-7) · [Security](../docs/prd.md#security).

## Scope

- Revoke sets status revoked; reissue rotates the token and bumps token_version.
- Revocation list exposed to scanners for offline checks.
- Admin buttons with confirmation.

## Out of scope

- Scanner download of the list (WED-065).

## Acceptance criteria

- [ ] After reissue the old /i/ link shows the neutral page and the new link works.
- [ ] An old signed QR verifies cryptographically but is reported Revoked because its version is stale (unit).
- [ ] Every revoke/reissue is logged with actor and time.

## Test plan

- Unit: Version check logic.
- End-to-end: Admin reissues; old link fails.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/invitations/server/`
- `src/modules/checkin/lib/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
