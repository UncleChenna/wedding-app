---
id: TICKET-205
title: Reject database commands when a worktree URL targets another stack
epic: foundations
status: in_progress
priority: urgent
estimate: M
labels: [infra, test]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-205
pr: ""
created: 2026-10-27
updated: 2026-10-27
started: 2026-10-27
completed: ""
reason: ""
resume_to: ""
---

# TICKET-205: Reject database commands when a worktree URL targets another stack

## Context

TICKET-006's 2026-10-27 rehearsal found that TICKET-195's failed stack startup left its copied DATABASE_URL pointing at the primary local port 54322 instead of its reserved 39281. drizzle.config.ts and seed.ts check no managed identity (seed checks only localhost), so database commands can target a different local stack. The migration invocation found existing migrations only; no data-isolation success is claimed. See [collaboration](../docs/collaboration.md) and TICKET-006.

## Scope

- Validate database target against managed worktree identity before migration, seed and database-check commands connect.
- Fail closed for linked checkouts missing valid managed metadata, wrong path, host, port or database name, including shell environment overrides.
- Preserve supported primary-checkout commands and explicitly configured deployment migration behavior.
- Add a clear recovery message directing users to complete managed db:start; never print credentials.

## Out of scope

- Database schema, data resets, production migrations, RLS changes and global Docker restarts.
- Full concurrent lifecycle proof remains TICKET-006.

## Acceptance criteria

- [x] A managed worktree with a primary/other-stack URL fails before any database connection or destructive statement for migrate, seed and checks.
- [x] Correct worktree configuration passes; missing/mismatched metadata and effective environment overrides fail with sanitized actionable errors.
- [x] Tests cover copied-primary URL after failed setup, another worktree URL, host/port/database/path mismatches and valid primary/deployment behavior.
- [x] Command-level regression proves no SQL executes on the wrong target; quick and full verification pass.

## Test plan

- Unit: identity validation matrix with isolated temporary fixtures, no secrets.
- Integration: instrument database entrypoints to verify rejection precedes connection; use isolated local stacks for the valid path.
- Manual: repeat the TICKET-006 failed-setup scenario without allowing any wrong-target SQL.

## Files likely touched

- scripts/harness/ database identity helper and tests
- drizzle.config.ts; scripts/seed.ts; scripts/db-check.ts
- docs/collaboration.md; docs/handoffs/TICKET-205.md

## Notes / decisions

- 2026-10-27 — Discovered by TICKET-006 rehearsal; protects against accidental cross-worktree writes, not a database access-control boundary.

- 2026-10-27 — Implemented pre-connection target guard.22 targeted tests and full gate pass; see handoff and PR body for actual counts and scope limits.

## Activity log

- 2026-10-27 — new → todo — divine
- 2026-10-27 — todo → claimed — divine (codex)
- 2026-10-27 — todo → in_progress — divine (codex)
- 2026-10-27 — in_progress → blocked — divine (codex) — Initial commit rejected: contiguous-ID validator requires unmerged TICKET-204 definition. Await explicit exception to carry unchanged definition only, or PR43 merge into develop; no hook bypass.
- 2026-10-27 — blocked → in_progress — divine (codex) — PR43 merged; ticket definition gap resolved. Resume database target guard.
