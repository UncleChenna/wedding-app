---
id: TICKET-123
title: Apply ordering abuse limits and regress shared endpoint protection
epic: security
status: done
priority: high
estimate: M
labels: [security, backend]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-185, TICKET-072, TICKET-048]
blocks: [TICKET-129]
branch: TICKET-123
pr: https://github.com/UncleChenna/wedding-app/pull/145
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-123: Apply ordering abuse limits and regress shared endpoint protection

## Context

The PRD requires rate limits on IV lookups, order creation and PIN attempts.

See: [Security](../docs/prd.md#security).

## Scope

- Extend TICKET-185 shared limiter to unauthenticated ordering, lost-link requests and cross-endpoint regression. Invitation/PIN launch protection ships in TICKET-185.

## Out of scope

- WAF rules.

## Acceptance criteria

- [x] Exceeding each limit returns 429 with a friendly message (unit + e2e).
- [x] IPs are stored hashed with a rotating salt (test).

## Test plan

- Unit: Limiter.
- End-to-end: Limit hits.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/server/rate-limit.ts`

## Notes / decisions

- 2026-11-09: Ordering now uses an independent 240-attempt/60-second network budget before request parsing. Existing lookup/PIN/lost-link policies and per-table limits remain unchanged. Daily HMAC salt rotation, fixed-window/midnight burst tradeoffs, generated migration 0026 and rollout are documented in docs/reviews/TICKET-123/rate-limits.md.
- 2026-11-09: Actual database and browser evidence is in docs/plans/TICKET-123-pr.md (PR145). Server Actions retain existing typed form-message transport; HTTP routes return actual429. Mobile page performance86/88/89 and unverified physical WhatsApp checks remain release requirements under TICKET-201; no95-score/device-pass claim. Final hosted CI still required before merge.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — divine (codex)
- 2026-11-09 — todo → in_progress — divine (codex)
- 2026-11-09 — in_progress → in_review — divine (codex)
