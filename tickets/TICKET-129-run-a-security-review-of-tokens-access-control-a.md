---
id: TICKET-129
title: Run a security review of tokens, access control and actions
epic: security
status: done
priority: high
estimate: M
labels: [security, test]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-066, TICKET-078, TICKET-096, TICKET-123, TICKET-128, TICKET-184]
blocks: [TICKET-154, TICKET-164]
branch: TICKET-129
pr: https://github.com/UncleChenna/wedding-app/pull/185
created: 2026-10-21
updated: 2026-11-13
started: 2026-11-13
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

- [x] Review report in docs/audits/ covering every server action.
- [x] `pnpm audit --prod` has no high/critical issues.

- [x] No unresolved high/critical security finding may pass the release gate; each finding needs a linked bounded fix and successful retest, not just a report.

## Test plan

- Manual: Review.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: attach the route/action matrix, findings and retest evidence without secrets.

## Files likely touched

- `docs/audits/`

## Notes / decisions

- 2026-11-13 — Audited 38 exported actions and 35 route handlers against develop6b2c9d3e. Two moderate origin/body-buffering findings reproduced and fixed in this ticket. See docs/audits/TICKET-129-security-review.md and docs/plans/TICKET-129-pr.md for scope, retests and deployment limitations. Production advisory audit: zero high/critical (zero total). Required CI remains pending before merge; no unresolved high/critical finding identified.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
- 2026-11-13 — in_progress → in_review — divine (codex)
