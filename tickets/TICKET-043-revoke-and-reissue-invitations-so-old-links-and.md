---
id: TICKET-043
title: Revoke and reissue invitations so old links and QRs stop working
epic: invitations
status: in_progress
priority: urgent
estimate: M
labels: [backend, security]
module: invitations
owner: divine
agent: codex
blocked_by: [TICKET-036, TICKET-056, TICKET-032, TICKET-088]
blocks: [TICKET-065, TICKET-089, TICKET-176]
branch: TICKET-043
pr: ""
created: 2026-10-21
updated: 2026-11-04
started: 2026-11-04
completed: ""
reason: ""
resume_to: ""
---

# TICKET-043: Revoke and reissue invitations so old links and QRs stop working

## Context

INV-7: the admin can revoke or reissue an IV and the old QR stops working on connected devices immediately, and on disconnected devices after refresh within the TICKET-169 policy, including on offline scanners.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-7) · [Security](../docs/prd.md#security).

## Scope

- Revoke sets status revoked; reissue rotates the token and bumps token_version.
- Revocation list exposed to scanners for offline checks.
- Admin buttons with confirmation.

## Out of scope

- Scanner download of the list (TICKET-065).

## Acceptance criteria

- [ ] After reissue the old /i/ link shows the neutral page and the new link works.
- [ ] An old signed QR verifies cryptographically but is reported Revoked because its version is stale (unit).
- [ ] Every revoke/reissue is logged with actor and time.

- [ ] Online validation rejects old links and pass versions immediately. Offline scanners follow TICKET-169 snapshot freshness; UI must not promise immediate disconnected revocation.

## Test plan

- Unit: Version check logic.
- End-to-end: Admin reissues; old link fails.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: End-to-end: revoke while one scanner is offline; verify its stale warning/policy and rejection after refresh.

## Files likely touched

- `src/modules/invitations/server/`
- `src/modules/checkin/lib/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-04 — todo → claimed — divine (codex)
- 2026-11-04 — todo → in_progress — divine (codex)
