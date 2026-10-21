---
id: WED-034
title: Decide wedding date, RSVP lock, tag-along limit and Wallet scope
epic: invitations
status: todo
priority: high
estimate: S
labels: [human, docs]
module: invitations
owner: ""
agent: ""
blocked_by: []
blocks: []
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-034: Decide wedding date, RSVP lock, tag-along limit and Wallet scope

## Context

Open questions block RSVP rules: the tag-along limit, when edits lock, and whether Apple/Google Wallet passes are worth the paid issuer accounts. docs/current-state.md lists the assumptions to confirm.

See: [Open questions](../docs/prd.md#open-questions) · [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-4, INV-5, INV-6).

## Scope

- Confirm date, venue, map link, dress code, time zone.
- Confirm default tag-along limit (assumed 1) and lock time (assumed 00:00 on the day).
- Confirm Wallet passes are out of v1 (assumed).
- Confirm retention period (assumed 90 days) for WED-127.

## Out of scope

- Wording (see WED-035).

## Acceptance criteria

- [ ] Every assumption 1–4 and 14 in docs/current-state.md is marked confirmed or changed in that file.
- [ ] Values are entered in seed/settings or recorded in notes for WED-101.

## Test plan

- Manual: Couple answers; agent updates docs/current-state.md.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/current-state.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
