---
id: TICKET-197
title: Resolve pnpm for hooks launched with a minimal PATH
epic: foundations
status: in_review
priority: urgent
estimate: S
labels: [infra, test]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-197
pr: https://github.com/UncleChenna/wedding-app/pull/28
created: 2026-10-26
updated: 2026-10-26
started: 2026-10-26
completed: ""
reason: ""
resume_to: ""
---

# TICKET-197: Resolve pnpm for hooks launched with a minimal PATH

## Context

GUI-launched agent hooks cannot locate pnpm when its user installation directory is absent from PATH. User-reported post/stop failures block tool use and verification. See docs/collaboration.md.

## Scope

- Resolve pnpm from inherited PATH, Node's directory, PNPM_HOME and standard user installation locations.
- Pass the resolved pnpm and Node directories to child processes.
- Keep verification failures blocking and document setup recovery.

## Out of scope

- Disabling hooks, installing packages automatically, homepage implementation or changing CI.

## Acceptance criteria

- [x] Hooks run pnpm with a minimal GUI PATH using a supported existing installation.
- [x] Existing PATH selection is preserved and nested Node commands resolve.
- [x] Missing executables give actionable guidance; failed verification still blocks completion.
- [x] Regression tests and full verification pass.

## Test plan

- Unit: installation fallback, PATH precedence, missing executable.
- Integration: real stop hook subprocess under minimal PATH, both success and failure.
- Gate: verify:quick and verify.

## Files likely touched

- scripts/harness/hooks.mjs, scripts/harness/pnpm-runtime.mjs, scripts/__tests__/pnpm-resolution.test.ts
- docs/collaboration.md and ticket-specific plan/handoff.

## Notes / decisions

- 2026-10-26: Quick/full gates pass: 223 unit tests, 86 browser passes, 12 existing conditional skips. Minimal-PATH invocation resolves installed pnpm 12.14.0.

- No shell discovery or automatic package download. Preserve all verification gates.

## Activity log

- 2026-10-26 — new → todo — divine
- 2026-10-26 — todo → claimed — divine (codex)
- 2026-10-26 — todo → in_progress — divine (codex)
- 2026-10-26 — in_progress → in_review — divine (codex)
