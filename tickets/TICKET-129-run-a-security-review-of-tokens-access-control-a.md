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
completed: 2026-11-13
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
- 2026-11-13 — in_review → blocked — divine (codex) — Merged PR185 final CI43386213746 failed only ordering transfer diagnostics, with a later context.close timeout; all security-related jobs passed. Verified repair PR188 is now merged.
- 2026-11-13 — blocked → done — divine (codex) — Reconciled original https://github.com/UncleChenna/wedding-app/pull/185; previous block: Merged PR185 final CI43386213746 failed only ordering transfer diagnostics, with a later context.close timeout; all security-related jobs passed. Verified repair PR188 is now merged.; PR185 CI43386213746 stalled in supplemental Chromium request-size diagnostics after network quiescence, later surfacing a context.close timeout. Merged PR188 bounds those diagnostics without weakening raw-byte budgets and passed full exact-head CI including the security changes.; verified repair https://github.com/UncleChenna/wedding-app/pull/188 head ab4f5883bbf2af3017c3249fab5495728c6fbd24; CI https://github.com/UncleChenna/wedding-app/actions/runs/43389448112; develop 49ecb0d117552806e77e0d6b62911705c864f99e
