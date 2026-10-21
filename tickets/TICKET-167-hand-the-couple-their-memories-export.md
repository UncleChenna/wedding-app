---
id: TICKET-167
title: Hand the couple their memories export
epic: launch
status: todo
priority: low
estimate: S
labels: [human]
module: ops
owner: ""
agent: ""
blocked_by: [TICKET-166]
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

# TICKET-167: Hand the couple their memories export

## Context

The couple keep their keepsake data before personal data is deleted.

See: [Privacy (UK GDPR)](../docs/prd.md#privacy-uk-gdpr).

## Scope

- Run the export and store it in the couple's own storage.

## Out of scope

- Photo sharing (out of v1).

## Acceptance criteria

- [ ] Couple confirms receipt in notes.

## Test plan

- Manual: Hand-over.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/runbook.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
