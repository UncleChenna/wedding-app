---
id: TICKET-158
title: Proof-read every guest-facing message and screen
epic: launch
status: todo
priority: urgent
estimate: S
labels: [human, docs]
module: invitations
owner: ""
agent: ""
blocked_by: [TICKET-035, TICKET-041, TICKET-052, TICKET-044, TICKET-045, TICKET-046]
blocks: [TICKET-159, TICKET-164]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-158: Proof-read every guest-facing message and screen

## Context

Final wording check before anything goes to guests.

See: [Invitation wording](../docs/prd.md#invitation-wording) · [On the website](../docs/prd.md#on-the-website).

## Scope

- Read every screen and message in the chosen voice on a phone; fix typos via PR.

## Out of scope

- Translations.

## Acceptance criteria

- [ ] Couple signs off in notes; fixes merged.

- [ ] Approve exact PRD formal/warm wording, including invite, RSVP, pass and share messages before first send; later order/scanner messages are checked by their flow tests and TICKET-164.

## Test plan

- Manual: Proof-read.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: compare strings to the approved PRD voice, placeholders and rendered small-screen copy.

## Files likely touched

- `src/modules/invitations/lib/copy.ts`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
