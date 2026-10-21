---
id: WED-002
title: Allow reads outside the checkout and fix shell-guard false positives
epic: foundations
status: todo
priority: urgent
estimate: S
labels: [infra, test, security]
module: harness
owner: ""
agent: ""
blocked_by: []
blocks: [WED-006]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-002: Allow reads outside the checkout and fix shell-guard false positives

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

- [ ] Reading a file in the OS temp directory is allowed; reading `.env.local` is still denied.
- [ ] `grep -n process.env src/x.ts | sed -n 1p` is allowed; `sed -i s/a/b/ .env.local` and `cp x drizzle/0001.sql` are denied.
- [ ] Each case is covered by a unit test in hooks.test.ts.

## Test plan

- Unit: Table-driven cases for allowed and denied commands and paths.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `scripts/harness/hooks.mjs`
- `scripts/__tests__/hooks.test.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
