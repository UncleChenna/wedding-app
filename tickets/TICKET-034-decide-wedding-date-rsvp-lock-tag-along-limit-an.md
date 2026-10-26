---
id: TICKET-034
title: Decide wedding date, RSVP lock, tag-along limit and Wallet scope
epic: invitations
status: in_progress
priority: urgent
estimate: S
labels: [human, docs]
module: invitations
owner: divine
agent: codex
blocked_by: []
blocks: [TICKET-023, TICKET-042, TICKET-096, TICKET-101, TICKET-176, TICKET-177]
branch: TICKET-034
pr: ""
created: 2026-10-21
updated: 2026-10-26
started: 2026-10-26
completed: ""
reason: ""
resume_to: ""
---

# TICKET-034: Decide wedding date, RSVP lock, tag-along limit and Wallet scope

## Context

Open questions block RSVP rules: the tag-along limit, when edits lock, and whether Apple/Google Wallet passes are worth the paid issuer accounts. docs/current-state.md lists the assumptions to confirm.

See: [Open questions](../docs/prd.md#open-questions) · [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-4, INV-5, INV-6).

## Scope

- Confirm date, venue, map link, dress code, time zone.
- Confirm default tag-along limit (assumed 1) and lock time (assumed 00:00 on the day).
- Decide Wallet scope explicitly; an approved PRD amendment or implementation backlog is required.
- Confirm retention period (assumed 90 days) for TICKET-127.

## Out of scope

- Wording (see TICKET-035).

## Acceptance criteria

- [x] Every assumption 1–4 and 14 in docs/current-state.md is marked confirmed or changed in that file.
- [x] Values are entered in seed/settings or recorded in notes for TICKET-101.

- [x] Wallet is an unresolved PRD journey requirement, not automatically out of v1. Record explicit owner approval to amend scope, or create issuer/account and implementation tickets through t:new and add them to TICKET-176 before closing this decision.

## Test plan

- Manual: Couple answers; agent updates docs/current-state.md.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: attach dated scope approval or linked implementation tickets; unanswered decisions cannot be marked confirmed.

## Files likely touched

- `docs/current-state.md`

## Notes / decisions

- 2026-10-26: Owner approved the stated RSVP/retention defaults and explicitly deferred Wallet for launch in favour of QR/image/PDF. Venue, ceremony time, time zone, map and dress code are TBD by owner response. PRD/current-state records distinguish approved policies from unknown details; TICKET-101 and TICKET-176 track configuration/release requirements. Exact UTC cutoff remains undefined until the venue zone is configured. No live configuration or deletion occurred.

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-26 — todo → claimed — divine (codex)
- 2026-10-26 — todo → in_progress — divine (codex)
