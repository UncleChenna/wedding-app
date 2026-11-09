---
id: TICKET-220
title: Separate scanner implementation from physical-device release approval
epic: foundations
status: in_progress
priority: high
estimate: S
labels: [docs]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-220
pr: ""
created: 2026-11-09
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-220: Separate scanner implementation from physical-device release approval

## Context

The user requires staff accounts and roles to be managed in admin, rather than collecting operator names before coding. TICKET-096 and TICKET-064 are complete. TICKET-057 still depends on the human roster/device task TICKET-055, preventing software implementation despite completed signing prerequisite TICKET-056. Preserve the PRD [gate check-in](../docs/prd.md#gate-check-in) and [testing plan](../docs/prd.md#testing-plan) requirements while separating implementation evidence from physical-device release approval.

## Scope

- Remove only the 055-to-057 implementation dependency.
- Transfer physical token-verification/timing criteria verbatim to release-blocking TICKET-114; retain actual-camera/low-light venue checks in TICKET-163.
- Clarify 055 operational readiness and 057 automated browser evidence without claiming any human task complete.

## Out of scope

- Scanner implementation, new dependencies, CI/security-policy changes, real-device certification and staffing decisions.

## Acceptance criteria

- [ ] TICKET-057 can begin after completed TICKET-056 without waiting for TICKET-055; all edited tickets are unclaimed before editing.
- [ ] Both physical verification criteria are preserved verbatim in TICKET-114; device/installation, guest WhatsApp, runbook, training and release dependencies remain mandatory and acyclic.
- [ ] Ticket validation, rendering, dependency/workflow regression tests and quick verification pass; no human status or acceptance checkbox is marked complete.

## Test plan

- Manual: Validate and render the backlog; inspect dependency edges and unchanged release/training gates.
- Unit: Run existing ticket graph/workflow tests and focused regression for preserved physical requirements.
- Run quick verification and independent review before merge.

## Files likely touched

- `tickets/TICKET-055-*.md`, `tickets/TICKET-057-*.md`, `tickets/TICKET-114-*.md`, `tickets/TICKET-163-*.md`.
- Ticket-specific evidence under `docs/plans/` and `docs/handoffs/`.

## Notes / decisions

- 2026-11-09: Live ledger inspection found all four target tickets todo and unowned. Current user authorization permits this scoped correction; no device or training check is certified.

## Activity log

- 2026-11-09 — new → todo — divine (codex)
- 2026-11-09 — todo → claimed — divine (codex)
- 2026-11-09 — todo → in_progress — divine (codex)
