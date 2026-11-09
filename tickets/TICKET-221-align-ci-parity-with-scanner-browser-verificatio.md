---
id: TICKET-221
title: Repair scanner CI parity and signature canonicality
epic: foundations
status: done
priority: high
estimate: S
labels: [test]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-221
pr: https://github.com/UncleChenna/wedding-app/pull/131
created: 2026-11-09
updated: 2026-11-09
started: 2026-11-09
completed: 2026-11-09
reason: ""
resume_to: ""
---

# TICKET-221: Repair scanner CI parity and signature canonicality

## Context

PR #127 added required Chromium/WebKit gate-token verification for [Gate check-in](../docs/prd.md#gate-check-in) (CHK-6), but its CI parity test still expected Chromium-only installation. CI run 42615319117 failed that assertion; the PR was externally merged before the prepared repair. Restore the exact workflow contract on a fresh develop branch without weakening verification.

## Scope

- Enforce RFC 8032 S < L before native or fallback signature verification; Linux WebKit accepted a high-S signature during the repaired CI run. Preserve the existing strict browser vector.

- Update the parity contract to require both browser engines.
- Include named run steps so database migration and the dedicated scanner suite cannot disappear unnoticed.
- Preserve full verification, existing timeout budgets, and scanner/device release gates.

## Out of scope

- Admission rules, physical certification (TICKET-114), and unrelated hook fixture isolation. The narrow TICKET-057 canonical-signature regression exposed by this integration is included.

## Acceptance criteria

- [x] Noncanonical high-S signatures fail before backend dispatch even when native WebCrypto would accept them; unchanged Chromium/WebKit vectors pass.

- [x] CI parity requires frozen install, Chromium and WebKit, agent checks, database migration, full verify and dedicated scanner verification in order.
- [x] The known failure is reproduced before repair and both parity tests pass after repair.
- [x] Quick verification and final required CI pass without weakening assertions or timeouts.

## Test plan

- Unit: scripts/__tests__/ci-parity.test.ts red/green, then full unit suite.
- CI: existing full verify and dedicated scanner suite remain unchanged.
- Manual: review exact workflow/test command parity and retained failure evidence.

## Files likely touched

- `scripts/__tests__/ci-parity.test.ts`
- `src/modules/checkin/lib/gate-token.ts` and its scanner regression tests
- Ticket-specific evidence and PR description.

## Notes / decisions

- Original source failure: expected chromium-only install versus actual chromium+webkit. Not a runtime timeout. TICKET-057 stays incomplete until this repair passes CI.

## Activity log

- 2026-11-09 — new → backlog — divine
- 2026-11-09 — backlog → todo — divine
- 2026-11-09 — todo → claimed — divine (codex)
- 2026-11-09 — todo → in_progress — divine (codex)
- 2026-11-09 — CI run 42623016949 passed all five checks at bfe75af5, including full verification and Linux Chromium/WebKit scanner vectors. Root independently reviewed the scalar guard and parity contract without blockers. Integrated develop 1f619b05 without conflicts; the combined final head must pass CI before merge.
- 2026-11-09 — in_progress → in_review — divine (codex)
- 2026-11-09 — in_review → done — divine (codex)
