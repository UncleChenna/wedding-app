---
id: TICKET-032
title: Protect admin and staff routes in the request proxy
epic: data-auth
status: todo
priority: urgent
estimate: M
labels: [security, backend]
module: shared
owner: ""
agent: ""
blocked_by: [TICKET-030, TICKET-031]
blocks: [TICKET-043, TICKET-059, TICKET-061, TICKET-088, TICKET-181]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-032: Protect admin and staff routes in the request proxy

## Context

Every admin and staff page and server action must check the right session; guests must never reach them.

See: [Users and roles](../docs/prd.md#users-and-roles) · [Security](../docs/prd.md#security).

## Scope

- Require AAL2 for admin and scoped staff sessions for staff routes/actions. Guest RSVP uses its invitation capability; table ordering remains unauthenticated under ORD-8 with validated inputs and abuse limits.

## Out of scope

- New roles.

## Acceptance criteria

- [ ] Admin/staff routes and server actions reject missing, expired or wrong-role credentials, including direct action invocation.
- [ ] Anonymous guests can order and authorized invitation holders can RSVP without staff login; neither can invoke privileged actions.
- [ ] An executable role/route/action matrix covers admin, gate, kitchen, bar, guest capability and anonymous callers; status endpoints disclose no other household data.

## Test plan

- Unit: Guard helpers.
- End-to-end: Route matrix test.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/proxy.ts`
- `src/modules/shared/server/guards.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
