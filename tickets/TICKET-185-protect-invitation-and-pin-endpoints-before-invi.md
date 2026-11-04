---
id: TICKET-185
title: Protect invitation and PIN endpoints before invitations launch
epic: security
status: in_review
priority: urgent
estimate: M
labels: [security, backend, test]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-031, TICKET-036, TICKET-183]
blocks: [TICKET-048, TICKET-123, TICKET-176]
branch: TICKET-185
pr: https://github.com/UncleChenna/wedding-app/pull/89
created: 2026-10-21
updated: 2026-11-04
started: 2026-11-04
completed: ""
reason: ""
resume_to: ""
---

# TICKET-185: Protect invitation and PIN endpoints before invitations launch

## Context

Backlog audit coverage: Security, INV-2, ADM-4. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Protect the early invitation release without waiting for ordering to exist.

## Out of scope

- Work outside the stated contract; consuming screens and launch operations remain in their linked tickets. No product implementation is part of this audit.

## Acceptance criteria

- [x] Use a shared atomic rate-limit store across instances for invitation/pass lookups and PIN attempts, with bounded expiry and a documented identity strategy that cannot be reset by changing a client device id.
- [x] Validate trusted proxy headers, avoid logging raw tokens/PINs/IP addresses, and return uniform privacy-safe lookup failures with retry guidance.
- [x] Test distributed bursts, cooldown expiry and legitimate households behind one network; TICKET-123 later adds ordering limits and cross-endpoint regression.

## Test plan

- Integration: two application instances share the limiter, simultaneous requests cannot overshoot the approved budget, and forged forwarding headers do not bypass it. Manual: approve documented limits using synthetic traffic.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- src/modules/shared/server/; src/modules/invitations/; src/modules/checkin/

## Notes / decisions

- 2026-11-04 — Owner approved migration commit/authorization and launch budgets (lookup 1,200/60s; PIN 30/600s). Full verification passes: 937 unit tests, 775 browser checks; 82 unit and 165 browser opt-in skips are not counted as passes. Five explicit database tests and six focused retry browser cases passed separately. Device release checks remain mandatory.

- 2026-11-04 — Owner approved the native HTML retry page and existing local fonts; physical-phone checks remain mandatory release requirements in TICKET-201. Migration authorization, launch-budget approval and full verification remain pending.

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.

## Activity log

- 2026-10-21 — new → todo — divine
- 2026-11-04 — todo → claimed — divine (codex)
- 2026-11-04 — todo → in_progress — divine (codex)
- 2026-11-04 — in_progress → blocked — divine (codex) — Awaiting exact-path migration commit authorization and launch-budget approval; cold-font regression and full verification remain incomplete (draft PR #89).
- 2026-11-04 — blocked → in_progress — divine (codex) — Continue independent cold-font diagnosis; migration and budget approvals remain pending.
- 2026-11-04 — in_progress → blocked — divine (codex) — Awaiting migration commit authorization, launch-budget approval and native retry/device-review exception; full verification remains pending. Cold-font and Lighthouse checks now pass (draft PR #89).
- 2026-11-04 — blocked → in_progress — divine (codex) — Record approved native retry-page exception; retain physical-device release checks.
- 2026-11-04 — in_progress → blocked — divine (codex) — Awaiting exact-path migration commit authorization and launch-budget approval before full verification. Native retry exception approved; physical-phone checks remain release requirements. Draft PR #89.
- 2026-11-04 — blocked → in_progress — divine (codex) — Owner approved migration and budgets; verification underway.
- 2026-11-04 — in_progress → in_review — divine (codex)
- 2026-11-04 — in_review → in_progress — divine (codex) — Integrate merged TICKET-032 while preserving authorization and request budgets.
- 2026-11-04 — in_progress → blocked — divine (codex) — Integrated proxy conflict fixed; full verification has 7 browser timeouts and a direct DB timeout with only 53MB Docker VM memory available. Diagnose/reverify after capacity recovers; approvals are complete.
- 2026-11-04 — blocked → in_progress — divine (codex) — Isolated database recovered; all five unchanged limiter integration tests pass. Resume private-route and full verification.
