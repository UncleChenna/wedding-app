---
id: TICKET-035
title: Choose the invitation voice and approve guest-facing copy
epic: invitations
status: in_progress
priority: urgent
estimate: S
labels: [human, docs]
module: invitations
owner: divine
agent: codex
blocked_by: []
blocks: [TICKET-040, TICKET-052, TICKET-101, TICKET-158, TICKET-176]
branch: TICKET-035
pr: ""
created: 2026-10-21
updated: 2026-10-26
started: 2026-10-26
completed: ""
reason: ""
resume_to: ""
---

# TICKET-035: Choose the invitation voice and approve guest-facing copy

## Context

The PRD drafts warm, playful and formal voices and asks to pick one and use it throughout.

See: [Invitation wording](../docs/prd.md#invitation-wording) · [On the website](../docs/prd.md#on-the-website).

## Scope

- Pick one voice for WhatsApp, email and reminders.
- Approve the on-site copy table, or edit it in docs/prd.md.

## Out of scope

- Final proof-read before sending (TICKET-158).

## Acceptance criteria

- [ ] docs/prd.md records the chosen voice and any edited copy.
- [ ] Copy is stored in one module (`src/modules/invitations/lib/copy.ts`) referenced by TICKET-052.

## Test plan

- Manual: Couple chooses.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/prd.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-26 — todo → claimed — divine (codex)
- 2026-10-26 — todo → in_progress — divine (codex)
