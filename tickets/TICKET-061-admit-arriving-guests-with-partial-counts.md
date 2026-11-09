---
id: TICKET-061
title: Admit arriving guests with partial counts
epic: checkin
status: in_progress
priority: high
estimate: M
labels: [frontend, backend]
module: checkin
owner: divine
agent: codex
blocked_by: [TICKET-024, TICKET-060, TICKET-064, TICKET-032]
blocks: [TICKET-062, TICKET-063, TICKET-065, TICKET-068, TICKET-097]
branch: TICKET-061
pr: ""
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-061: Admit arriving guests with partial counts

## Context

Staff tap Admit and enter how many people arrived; the IV is used only when its allowance is reached.

See: [Gate check-in](../docs/prd.md#gate-check-in) (CHK-3) · [Journey 2: check-in at the gate](../docs/prd.md#journey-2-check-in-at-the-gate).

## Scope

- Stepper defaulting to remaining allowance.
- Idempotent server action keyed by client_event_id.
- Immediate visual confirmation.

## Out of scope

- Offline queue (TICKET-066).

## Acceptance criteria

- [ ] Admitting 2 of 4 leaves 2 remaining; a second scan shows Valid with 2 remaining (e2e).
- [ ] Retrying the same client_event_id creates no duplicate (unit).
- [ ] Over-admit is refused with a clear message.

## Test plan

- Unit: Action idempotency.
- End-to-end: Partial admission flow.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/checkin/`

## Notes / decisions

- 2026-11-09 — Implemented explicit partial admission with strict auth-first POST, signature validation, immutable actor/count replay binding, row locks and final reauthorization. Existing triggers maintain canonical counters; no migration or offline outbox work. UI distinguishes committed admission from read-only validation and historical duplicate receipts.
- 2026-11-09 — Focused quick55pass, isolated database5/5pass and production browser2/2pass. Browser proves actual lost-response replay does not increment twice; all-theme axe/bounds/44px checks pass. Full coverage, final keyboard assertions and independent UI review are pending. Final base integration waits for TICKET-108; physical checks remain release-gated.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — divine (codex)
- 2026-11-09 — todo → in_progress — divine (codex)
