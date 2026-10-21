---
id: WED-036
title: "Generate invitation tokens and the personal /i/[token] route"
epic: invitations
status: todo
priority: urgent
estimate: M
labels: [backend, security]
module: invitations
owner: ""
agent: ""
blocked_by: [WED-023]
blocks: [WED-037, WED-040, WED-043, WED-048, WED-050, WED-090, WED-183, WED-185]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-036: Generate invitation tokens and the personal /i/[token] route

## Context

Each IV needs an unguessable 128-bit token and a personal link like oursite.com/i/8fK2…; unknown or revoked tokens must reveal nothing.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-2) · [Security](../docs/prd.md#security) · [Journey 1: receiving the IV and RSVP](../docs/prd.md#journey-1-receiving-the-iv-and-rsvp).

## Scope

- Token generation (crypto.randomBytes(16+), base64url) with uniqueness retry.
- `/i/[token]` route resolving the invitation server-side.
- Friendly not-found page that does not distinguish revoked from unknown.

## Out of scope

- Page design (WED-037).
- Rate limiting (WED-123).

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
