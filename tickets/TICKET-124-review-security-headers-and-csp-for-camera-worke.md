---
id: TICKET-124
title: Review security headers and CSP for camera, workers and realtime
epic: security
status: todo
priority: high
estimate: S
labels: [security]
module: shared
owner: ""
agent: ""
blocked_by: [TICKET-033, TICKET-059, TICKET-105, TICKET-149, TICKET-241]
blocks: [TICKET-154]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-124: Review security headers and CSP for camera, workers and realtime

## Context

New features (service worker, camera, Supabase realtime, Sentry) need a CSP that allows them and nothing else.

See: [Security](../docs/prd.md#security).

## Scope

- Verify the CSP and Permissions-Policy implementation from TICKET-241 on HTTPS staging and production; retain ADR 0006 evidence.

## Out of scope

- Nonce-based CSP.

## Acceptance criteria

- [ ] securityheaders.com grade A or better on production (screenshot).
- [ ] No CSP violations in e2e console logs.

- [ ] Verify security headers and CSP on the HTTPS staging deployment before production, including camera/worker/font requirements; repeat the same smoke checks after release.

## Test plan

- Unit: security-headers tests.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Integration: assert required headers and blocked script injection while camera and worker flows still function.

## Files likely touched

- `src/modules/shared/lib/security-headers.ts`
- `docs/decisions/0006-security-headers.md`

## Notes / decisions

2026-11-13: Local policy implementation and browser enforcement coverage are split into TICKET-241 so coding can proceed before TICKET-149 creates staging. Every acceptance criterion above remains mandatory here, including production grade A evidence, absence of unexpected CSP violations, HTTPS staging capability checks and post-release smoke checks. No deployment evidence or completion is implied.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
