---
id: TICKET-190
title: Refresh the local ticket dashboard automatically
epic: foundations
status: in_review
priority: high
estimate: M
labels: [infra, frontend, test]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-190
pr: https://github.com/UncleChenna/wedding-app/pull/15
created: 2026-10-21
updated: 2026-10-21
started: 2026-10-21
completed: ""
reason: ""
resume_to: ""
---

# TICKET-190: Refresh the local ticket dashboard automatically

## Context

See docs/tickets.md: the local board currently needs regeneration. Collaborators need automatic refresh using their own Git credentials and checkout.

## Scope

- Loopback read-only dashboard server with file watching and periodic ledger refresh.
- Preserve filters, theme and open ticket details during refresh; show connection and last-success state.
- Optional VS Code folder-open task and collaborator setup instructions.

## Out of scope

- Hosted access, mutation endpoints, automatic Git pulls/merges, or changing shared ticket definitions.

## Acceptance criteria

- [x] Server binds only to loopback; only board GET endpoints are served and cross-origin reads are rejected.
- [x] File changes and remote ledger updates refresh without rewriting tracked files or blocking requests during Git operations.
- [x] Filters, theme, open details and focus survive updates; offline/recovery and last-success states are visible.
- [x] Snapshot export remains available and optional VS Code startup is documented for collaborators.
- [x] Server and browser regression tests and full verification pass.

## Test plan

- Unit/integration: request restrictions, polling, watcher refresh, failures, cleanup and tracked-file preservation.
- Browser: automatic updates, retained controls/details, disconnect/recovery and responsive themes.
- Gate: pnpm verify:quick and pnpm verify.

## Files likely touched

- scripts/tickets/dashboard*, scripts/tickets.ts, package.json, .vscode/tasks.json
- scripts/__tests__/, e2e/, docs/tickets.md, README.md

## Notes / decisions

- One server per collaborator/checkout, with their Git access; no shared hosting or new service.

- 2026-10-21 — Implemented read-only live board, isolated refresh subprocess, recovery UX and optional editor startup. Full gate passes; review evidence in docs/reviews/TICKET-190/.

## Activity log

- 2026-10-21 — new → todo — divine (codex)
- 2026-10-21 — todo → claimed — divine (codex)
- 2026-10-21 — todo → in_progress — divine (codex)
- 2026-10-21 — in_progress → in_review — divine (codex)
