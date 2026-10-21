---
id: WED-129
title: Run a security review of tokens, access control and actions
epic: security
status: todo
priority: high
estimate: M
labels: [security, test]
module: shared
owner: ""
agent: ""
blocked_by: [WED-066, WED-078, WED-096, WED-123]
blocks: [WED-164]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-129: Run a security review of tokens, access control and actions

## Context

Hardening week: review every server action and route for authorisation, IDOR and token handling.

See: [Security](../docs/prd.md#security) · [Milestones, scope and testing](../docs/prd.md#milestones-scope-and-testing).

## Scope

- Checklist review; dependency audit; findings fixed or ticketed.

## Out of scope

- External pen test.

## Acceptance criteria

- [ ] Review report in docs/audits/ covering every server action.
- [ ] `pnpm audit --prod` has no high/critical issues.

## Test plan

- Manual: Review.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/audits/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
