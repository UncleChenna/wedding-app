---
id: WED-124
title: Review security headers and CSP for camera, workers and realtime
epic: security
status: todo
priority: high
estimate: S
labels: [security]
module: shared
owner: ""
agent: ""
blocked_by: [WED-033, WED-059, WED-105]
blocks: [WED-154]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-124: Review security headers and CSP for camera, workers and realtime

## Context

New features (service worker, camera, Supabase realtime, Sentry) need a CSP that allows them and nothing else.

See: [Security](../docs/prd.md#security).

## Scope

- Update CSP and Permissions-Policy; ADR 0006 addendum.

## Out of scope

- Nonce-based CSP.

## Acceptance criteria

- [ ] securityheaders.com grade A or better on production (screenshot).
- [ ] No CSP violations in e2e console logs.

## Test plan

- Unit: security-headers tests.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/lib/security-headers.ts`
- `docs/decisions/0006-security-headers.md`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
