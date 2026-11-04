---
id: TICKET-185
title: Protect invitation and PIN endpoints before invitations launch
epic: security
status: blocked
priority: urgent
estimate: M
labels: [security, backend, test]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-031, TICKET-036, TICKET-183]
blocks: [TICKET-048, TICKET-123, TICKET-176]
branch: TICKET-185
pr: ""
created: 2026-10-21
updated: 2026-11-04
started: 2026-11-04
completed: ""
reason: "Awaiting exact-path migration commit authorization and launch-budget approval; cold-font regression and full verification remain incomplete (draft PR #89)."
resume_to: in_progress
---

# TICKET-185: Protect invitation and PIN endpoints before invitations launch

## Context

Backlog audit coverage: Security, INV-2, ADM-4. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Protect the early invitation release without waiting for ordering to exist.

## Out of scope

- Work outside the stated contract; consuming screens and launch operations remain in their linked tickets. No product implementation is part of this audit.

## Acceptance criteria

- [ ] Use a shared atomic rate-limit store across instances for invitation/pass lookups and PIN attempts, with bounded expiry and a documented identity strategy that cannot be reset by changing a client device id.
- [ ] Validate trusted proxy headers, avoid logging raw tokens/PINs/IP addresses, and return uniform privacy-safe lookup failures with retry guidance.
- [ ] Test distributed bursts, cooldown expiry and legitimate households behind one network; TICKET-123 later adds ordering limits and cross-endpoint regression.

## Test plan

- Integration: two application instances share the limiter, simultaneous requests cannot overshoot the approved budget, and forged forwarding headers do not bypass it. Manual: approve documented limits using synthetic traffic.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- src/modules/shared/server/; src/modules/invitations/; src/modules/checkin/

## Notes / decisions

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.

## Activity log

- 2026-10-21 — new → todo — divine
- 2026-11-04 — todo → claimed — divine (codex)
- 2026-11-04 — todo → in_progress — divine (codex)
- 2026-11-04 — in_progress → blocked — divine (codex) — Awaiting exact-path migration commit authorization and launch-budget approval; cold-font regression and full verification remain incomplete (draft PR #89).
