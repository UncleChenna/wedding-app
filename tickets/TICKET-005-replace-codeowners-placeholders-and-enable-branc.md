---
id: TICKET-005
title: Replace CODEOWNERS placeholders and enable branch protection
epic: foundations
status: in_review
priority: urgent
estimate: S
labels: [human, infra, security]
module: harness
owner: unclechenna
agent: claude
blocked_by: [TICKET-004]
blocks: [TICKET-164, TICKET-176]
branch: TICKET-005
pr: ""
created: 2026-10-21
updated: 2026-11-13
started: 2026-11-13
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

- [x] CODEOWNERS contains no `REPLACE_ME`.
- [x] `gh api repos/{owner}/{repo}/branches/main/protection` shows required checks, one approving review and no force pushes.
- [ ] A test push straight to `main` is rejected by GitHub.

## Test plan

- Manual: Owner runs the script and pastes the API output in notes.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `.github/CODEOWNERS`
- `scripts/setup-branch-protection.sh`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

- 2026-11-13 (unclechenna, claude): owner chose the code owners (UncleChenna; ihemegodsfavour8-lang for check-in
  and ordering) and protection that admins can override, so a release isn't stuck if the other owner can't review.
  Required checks now match the lean CI (`lint, types, unit tests`, `no AI attribution in PR text`). Personal
  repos reject `bypass_pull_request_allowances`, so the script no longer sends it. Protection is applied to `main`.
  The third criterion isn't met as written: with the admin override, the owner's own push to `main` is allowed;
  a non-admin's push is rejected. Not tested by pushing, since agents never push to `main`.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
