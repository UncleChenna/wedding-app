---
id: TICKET-129
title: Run a security review of tokens, access control and actions
epic: security
status: todo
priority: high
estimate: M
labels: [security, test]
module: shared
owner: ""
agent: ""
blocked_by: [TICKET-066, TICKET-078, TICKET-096, TICKET-123, TICKET-128, TICKET-184]
blocks: [TICKET-154, TICKET-164]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-129: Run a security review of tokens, access control and actions

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

- [ ] No unresolved high/critical security finding may pass the release gate; each finding needs a linked bounded fix and successful retest, not just a report.

## Test plan

- Manual: Review.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: attach the route/action matrix, findings and retest evidence without secrets.

## Files likely touched

- `docs/audits/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
