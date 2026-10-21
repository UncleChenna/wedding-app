---
id: TICKET-083
title: Set up the WhatsApp alert number and confirm recipients
epic: alerts
status: todo
priority: urgent
estimate: S
labels: [human, infra]
module: ops
owner: ""
agent: ""
blocked_by: []
blocks: [TICKET-085]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-083: Set up the WhatsApp alert number and confirm recipients

## Context

Blocked on a person: sending WhatsApp alerts needs a WhatsApp Cloud API (or Twilio) account, a dedicated number, an approved message template and staff opt-ins. Start early; approval can take days.

See: [ORD-9 WhatsApp order alerts](../docs/prd.md#ord-9--whatsapp-order-alerts-must) · [Open questions](../docs/prd.md#open-questions).

## Scope

- Create the Meta Business / Cloud API app (or Twilio) and a dedicated number.
- Submit the order-alert template for approval.
- Confirm recipients and batching (assumption 7 in docs/current-state.md).

## Out of scope

- Code (TICKET-085).

## Acceptance criteria

- [ ] Template approved; a test message reaches a staff phone from the dedicated number.
- [ ] Credentials stored only in Vercel env (not git).
- [ ] docs/current-state.md assumption 7 confirmed or changed.

## Test plan

- Manual: Owner completes account setup.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/current-state.md`
- `docs/deployment.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
