---
id: TICKET-168
title: Confirm guest personal data is deleted after retention
epic: launch
status: todo
priority: high
estimate: S
labels: [human, security]
module: ops
owner: ""
agent: ""
blocked_by: [TICKET-127, TICKET-151, TICKET-184, TICKET-166]
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

# TICKET-168: Confirm guest personal data is deleted after retention

## Context

UK GDPR: delete guest data a set time after the wedding, including backups.

See: [Privacy (UK GDPR)](../docs/prd.md#privacy-uk-gdpr).

## Scope

- Verify the retention job ran; purge exports and backups past retention; shut down or downgrade services.

## Out of scope

- Keeping the site live.

## Acceptance criteria

- [ ] Queries show zero personal rows; backup deletion confirmed; record in notes.

- [ ] Execute the retention deadline independently of whether the optional memories export has been delivered; include offline caches and backup retention evidence.

## Test plan

- Manual: Verification.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: verify cutoff against approved event timezone and record deletion counts, not personal data.

## Files likely touched

- `docs/runbook.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
