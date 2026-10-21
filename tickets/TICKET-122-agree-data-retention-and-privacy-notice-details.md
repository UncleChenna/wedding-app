---
id: TICKET-122
title: Agree data retention and privacy notice details
epic: security
status: todo
priority: urgent
estimate: S
labels: [human, security, docs]
module: ops
owner: ""
agent: ""
blocked_by: []
blocks: [TICKET-126, TICKET-127]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-122: Agree data retention and privacy notice details

## Context

UK GDPR needs a named controller, contact, purposes and a retention period (PRD: e.g. 90 days).

See: [Privacy (UK GDPR)](../docs/prd.md#privacy-uk-gdpr).

## Scope

- Controller name and contact email; retention period; who sees dietary notes.

## Out of scope

- Legal review.

## Acceptance criteria

- [ ] Details recorded in notes and docs/current-state.md assumption 14 confirmed.

## Test plan

- Manual: Couple decides.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/current-state.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
