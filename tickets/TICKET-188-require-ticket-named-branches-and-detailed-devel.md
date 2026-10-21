---
id: TICKET-188
title: Require ticket-named branches and detailed develop PRs
epic: foundations
status: in_progress
priority: urgent
estimate: S
labels: [docs, infra, test]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: divine/TICKET-188-require-ticket-named-branches-and-detailed-devel
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: 2026-10-21
completed: ""
reason: ""
resume_to: ""
---

# TICKET-188: Require ticket-named branches and detailed develop PRs

## Context

The user requires traceable work: exact ticket-ID branches, pushed changes and detailed PRs into develop for human review/merge. See [workflow](../docs/tickets.md) and [PRD](../docs/prd.md).

## Scope

- Align shared rules, branch allocation, PR creation and integration-branch protections.
- Require task-specific changes, acceptance evidence, verification and risks in PR bodies.

## Out of scope

- Merging existing PRs, changing CI or rewriting other active branches.

## Acceptance criteria

- [ ] New ticket claims use the exact ticket ID as branch name; ticket filenames and PR titles retain the ID.
- [ ] PR tooling targets develop and requires a detailed task-specific body.
- [ ] Shared instructions require pushing work, human review/merge and no direct integration-branch changes.
- [ ] Regression tests, ticket validation and full verification pass.

## Test plan

- Unit/integration: branch allocation, PR body validation and protected develop pushes.
- Manual: inspect shared rules/template, verify current PR base and clean user checkout.

## Files likely touched

- AGENTS.md, shared skills, docs/tickets.md, PR template and ticket/harness scripts.

## Notes / decisions

- Ticket name means canonical ID, for example TICKET-188. Existing active branches remain compatible during rollout.

## Activity log

- 2026-10-21 — new → todo — divine
- 2026-10-21 — todo → claimed — divine (codex)
- 2026-10-21 — todo → in_progress — divine (codex)
