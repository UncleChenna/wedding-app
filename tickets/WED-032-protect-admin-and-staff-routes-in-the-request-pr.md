---
id: WED-032
title: Protect admin and staff routes in the request proxy
epic: data-auth
status: todo
priority: high
estimate: M
labels: [security, backend]
module: shared
owner: ""
agent: ""
blocked_by: [WED-030, WED-031]
blocks: [WED-088]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-032: Protect admin and staff routes in the request proxy

## Context

Every admin and staff page and server action must check the right session; guests must never reach them.

See: [Users and roles](../docs/prd.md#users-and-roles) · [Security](../docs/prd.md#security).

## Scope

- Next.js 16 `proxy.ts` (read the installed docs) redirects unauthenticated requests.
- Server-side guard helpers used by every action, not just the proxy.

## Out of scope

- New roles.

## Acceptance criteria

- [ ] Unauthenticated requests to /admin/*, /checkin, /kitchen and /bar redirect to sign-in or PIN entry (e2e).
- [ ] Every server action in admin/checkin/ordering calls a guard (enforced by a unit test that scans exports or a lint rule).

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
