---
id: TICKET-054
title: Prepare the day-before pass reminder batch
epic: sharing
status: in_review
priority: low
estimate: S
labels: [frontend]
module: admin
owner: divine
agent: codex
blocked_by: [TICKET-053, TICKET-052]
blocks: []
branch: TICKET-054
pr: https://github.com/UncleChenna/wedding-app/pull/132
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-054: Prepare the day-before pass reminder batch

## Context

The PRD drafts a day-before message reminding guests their pass lives at their link.

See: [Invitation wording](../docs/prd.md#invitation-wording).

## Scope

- List of attending invitations with the day-before message in the Share menu.

## Out of scope

- Sending automatically.

## Acceptance criteria

- [x] The list includes every rsvp_yes invitation and uses the day-before template (unit).

## Test plan

- Unit: Query and template.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

- 2026-11-09: Added protected Sharing → day-before pass reminders with the approved template and existing manual Share menu. Four unit tests, actual PostgreSQL status-selection test, production build and both real-auth browser projects pass (25.9s). Independent source/four-screenshot review clean. Generic sharing attempts/Undo preserve RSVP state; no automatic/external messages. See docs/plans/TICKET-054-pr.md. Full final-head CI remains required; shared baseline parity repair is TICKET-221/PR131.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — divine (codex) — started ahead of TICKET-053 (in_review)
- 2026-11-09 — todo → in_progress — divine (codex) — started ahead of TICKET-053 (in_review)
- 2026-11-09 — in_progress → in_review — divine (codex)
