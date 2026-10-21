---
id: TICKET-187
title: Require backlog alignment before coding
epic: foundations
status: in_review
priority: urgent
estimate: S
labels: [docs]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: divine/TICKET-187-require-backlog-alignment-before-coding
pr: https://github.com/UncleChenna/wedding-app/pull/5
created: 2026-10-21
updated: 2026-10-21
started: 2026-10-21
completed: ""
reason: ""
resume_to: ""
---

# TICKET-187: Require backlog alignment before coding

## Context

The user requires agents to review the task list before coding to confirm alignment with the [PRD](../docs/prd.md) and current plan.

## Scope

- Add a mandatory backlog preflight to shared instructions and workflow skills.
- Make the rule visible in the user's checkout and inherited by Claude.

## Out of scope

- Product code and ticket scheduling changes.

## Acceptance criteria

- [x] Shared instructions require live backlog, roadmap, ticket, dependency and PRD review before coding.
- [x] Agents state scope and verification, avoid duplicate or blocked work, and recheck after scope changes.
- [x] Workflow skills reference the same rule and Claude inherits it through AGENTS.md.

## Test plan

- Manual: inspect rule and Claude import; check links, formatting and ticket validation.

## Files likely touched

- AGENTS.md, .agents/skills/ticket-workflow/SKILL.md, .agents/skills/implement-task/SKILL.md.

## Notes / decisions

- Documentation-only change; no new code tests needed.

- 2026-10-21 — Canonical rule and both workflow references added. Claude, Cursor, Copilot and Gemini all point to AGENTS.md. Formatting, ticket validation and full verification pass (73 unit tests, build, 17 smoke passes; 7 existing skips).

## Activity log

- 2026-10-21 — new → todo — divine
- 2026-10-21 — todo → claimed — divine (codex)
- 2026-10-21 — todo → in_progress — divine (codex)
- 2026-10-21 — in_progress → in_review — divine (codex)
