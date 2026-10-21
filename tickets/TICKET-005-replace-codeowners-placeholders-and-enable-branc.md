---
id: TICKET-005
title: Replace CODEOWNERS placeholders and enable branch protection
epic: foundations
status: todo
priority: urgent
estimate: S
labels: [human, infra, security]
module: harness
owner: ""
agent: ""
blocked_by: [TICKET-004]
blocks: [TICKET-164, TICKET-176]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-005: Replace CODEOWNERS placeholders and enable branch protection

## Context

CODEOWNERS still contains `@REPLACE_ME_*` and `main` is unprotected, so review and CI gates are advisory only.

See: [Working together](../docs/collaboration.md).

## Scope

- Real GitHub handles in `.github/CODEOWNERS`.
- Run `scripts/setup-branch-protection.sh` once required checks exist.
- Confirm the plan allows required reviews for this repository's visibility.

## Out of scope

- Changing the review policy itself.

## Acceptance criteria

- [ ] CODEOWNERS contains no `REPLACE_ME`.
- [ ] `gh api repos/{owner}/{repo}/branches/main/protection` shows required checks, one approving review and no force pushes.
- [ ] A test push straight to `main` is rejected by GitHub.

## Test plan

- Manual: Owner runs the script and pastes the API output in notes.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `.github/CODEOWNERS`
- `scripts/setup-branch-protection.sh`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
