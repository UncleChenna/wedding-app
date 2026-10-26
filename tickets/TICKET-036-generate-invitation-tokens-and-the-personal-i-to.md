---
id: TICKET-036
title: "Generate invitation tokens and the personal /i/[token] route"
epic: invitations
status: in_progress
priority: urgent
estimate: M
labels: [backend, security]
module: invitations
owner: divine
agent: codex
blocked_by: [TICKET-023]
blocks: [TICKET-037, TICKET-040, TICKET-043, TICKET-048, TICKET-050, TICKET-090, TICKET-183, TICKET-185]
branch: TICKET-036
pr: ""
created: 2026-10-21
updated: 2026-10-26
started: 2026-10-26
completed: ""
reason: ""
resume_to: ""
---

# TICKET-036: Generate invitation tokens and the personal /i/[token] route

## Context

Each IV needs an unguessable 128-bit token and a personal link like oursite.com/i/8fK2…; unknown or revoked tokens must reveal nothing.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-2) · [Security](../docs/prd.md#security) · [Journey 1: receiving the IV and RSVP](../docs/prd.md#journey-1-receiving-the-iv-and-rsvp).

## Scope

- Token generation (crypto.randomBytes(16+), base64url) with uniqueness retry.
- `/i/[token]` route resolving the invitation server-side.
- Friendly not-found page that does not distinguish revoked from unknown.

## Out of scope

- Page design (TICKET-037).
- Rate limiting (TICKET-123).

## Acceptance criteria

- [ ] Tokens have ≥128 bits of entropy and are URL-safe (unit test on length/charset over 10k samples, no collisions).
- [ ] /i/<valid> renders the guest's invitation; /i/<unknown> and /i/<revoked> render the same neutral page with status 404.
- [ ] No sequential ids appear in any guest URL.

## Test plan

- Unit: Token generator and resolver.
- End-to-end: Valid and invalid token pages.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/invitations/lib/token.ts`
- `src/modules/invitations/server/`
- `src/app/(guest)/i/[token]/page.tsx`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-26 — todo → claimed — divine (codex)
- 2026-10-26 — todo → in_progress — divine (codex)
