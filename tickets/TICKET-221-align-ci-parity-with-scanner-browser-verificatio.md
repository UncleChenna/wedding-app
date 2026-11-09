---
id: TICKET-221
title: Align CI parity with scanner browser verification
epic: foundations
status: in_progress
priority: high
estimate: S
labels: [test]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-221
pr: ""
created: 2026-11-09
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-221: Align CI parity with scanner browser verification

## Context

PR #127 added required Chromium/WebKit gate-token verification for [Gate check-in](../docs/prd.md#gate-check-in) (CHK-6), but its CI parity test still expected Chromium-only installation. CI run 42615319117 failed that assertion; the PR was externally merged before the prepared repair. Restore the exact workflow contract on a fresh develop branch without weakening verification.

## Scope

- Update the parity contract to require both browser engines.
- Include named run steps so database migration and the dedicated scanner suite cannot disappear unnoticed.
- Preserve full verification, existing timeout budgets, and scanner/device release gates.

## Out of scope

- Token implementation (TICKET-057), physical certification (TICKET-114), and unrelated hook fixture isolation.

## Acceptance criteria

- [x] CI parity requires frozen install, Chromium and WebKit, agent checks, database migration, full verify and dedicated scanner verification in order.
- [x] The known failure is reproduced before repair and both parity tests pass after repair.
- [ ] Quick verification and final required CI pass without weakening assertions or timeouts.

## Test plan

- Unit: scripts/__tests__/ci-parity.test.ts red/green, then full unit suite.
- CI: existing full verify and dedicated scanner suite remain unchanged.
- Manual: review exact workflow/test command parity and retained failure evidence.

## Files likely touched

- `scripts/__tests__/ci-parity.test.ts`
- Ticket-specific evidence and PR description.

## Notes / decisions

- Original source failure: expected chromium-only install versus actual chromium+webkit. Not a runtime timeout. TICKET-057 stays incomplete until this repair passes CI.

## Activity log

- 2026-11-09 — new → backlog — divine
- 2026-11-09 — backlog → todo — divine
- 2026-11-09 — todo → claimed — divine (codex)
- 2026-11-09 — todo → in_progress — divine (codex)
