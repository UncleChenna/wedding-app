---
id: TICKET-002
title: Allow reads outside the checkout and fix shell-guard false positives
epic: foundations
status: in_review
priority: urgent
estimate: S
labels: [infra, test, security]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: [TICKET-003, TICKET-006]
branch: TICKET-002
pr: https://github.com/UncleChenna/wedding-app/pull/8
created: 2026-10-21
updated: 2026-10-21
started: 2026-10-21
completed: ""
reason: ""
resume_to: ""
---

# TICKET-002: Allow reads outside the checkout and fix shell-guard false positives

## Context

The pre-tool hook denies Read calls outside the checkout (tool output files, scratchpads) and blocks harmless shell commands that merely mention `process.env`, `node_modules/` or `drizzle/` alongside `sed`, `cp` or `>`.

See: [Current state](../docs/current-state.md) · [Working together](../docs/collaboration.md).

## Scope

- Only edits/writes are confined to the checkout; reads of non-secret paths are allowed.
- Match protected paths as write targets, not anywhere in the command text.
- Keep `.env*` reads and writes blocked.

## Out of scope

- Replacing the hook design (see ADR 0012).

## Acceptance criteria

- [x] Reading a file in the OS temp directory is allowed; reading `.env.local` is still denied.
- [x] `grep -n process.env src/x.ts | sed -n 1p` is allowed; `sed -i s/a/b/ .env.local` and `cp x drizzle/0001.sql` are denied.
- [x] Each case is covered by a unit test in hooks.test.ts.

## Test plan

- Unit: Table-driven cases for allowed and denied commands and paths.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `scripts/harness/hooks.mjs`
- `scripts/__tests__/hooks.test.ts`

## Notes / decisions

- 2026-10-21 — Implemented safe external reads, symlink-aware secret checks, and operand-based shell access inspection. Regression tests failed before the fix (12 failures); focused tests now pass (39). Full `pnpm verify` passed: 104 unit tests, production build, 17 smoke passes and 7 existing skips. Static inspection is not a shell sandbox; interactive Claude integration remains unverified. Ready for human review on `TICKET-002`.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-21 — todo → claimed — divine (codex)
- 2026-10-21 — todo → in_progress — divine (codex)
- 2026-10-21 — in_progress → in_review — divine (codex)
