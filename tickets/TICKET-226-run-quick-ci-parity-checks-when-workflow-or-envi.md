---
id: TICKET-226
title: Run quick CI parity checks when workflow or environment files change
epic: foundations
status: in_review
priority: high
estimate: S
labels: [infra, test]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-226
pr: https://github.com/UncleChenna/wedding-app/pull/153
created: 2026-11-09
updated: 2026-11-10
started: 2026-11-10
completed: ""
reason: ""
resume_to: ""
---

# TICKET-226: Run quick CI parity checks when workflow or environment files change

## Context

TICKET-123 and TICKET-062 added CI environment flags without immediately documenting them in `.env.example`. The existing full CI parity test catches this, but `verify:quick` related-test selection cannot infer dynamically read workflow/environment dependencies. This delays feedback until broad verification or review. See [engineering conventions](../docs/engineering.md) and [ticket workflow](../docs/tickets.md).

## Scope

- Explicitly select `scripts/__tests__/ci-parity.test.ts` during quick verification when `.github/workflows/**` or `.env.example` changes.
- Preserve normal related-test selection and deduplicate selected files.
- Cover staged, committed branch-diff and untracked workflow detection using the existing quick-verification change model.
- Record the verified repeated-mistake lesson in `docs/learnings.md`.

## Out of scope

- Changing CI policies, environment requirements, full verification, thresholds or hooks.
- Any scan logging or ordering implementation.

## Acceptance criteria

- [x] A red regression demonstrates that a workflow-only change currently omits parity; the fix invokes it.
- [x] Changing `.env.example` invokes parity even when no source import graph changes.
- [x] A temporary undocumented CI flag causes quick verification to fail through the existing parity assertion.
- [x] Unrelated source-only changes retain existing related-test behavior and do not duplicate parity execution.
- [x] The full CI parity test and quick-verification command tests pass without weakened checks.

## Test plan

- Unit/command: exercise changed-file selection with workflow, environment and unrelated source fixtures; assert selected test arguments and failure propagation.
- Regression: run a temporary fixture with an undocumented flag, observe red, document it and observe green.
- Gate: lint/types, focused harness tests and `pnpm verify:quick`; no product database or browser requirement.

## Files likely touched

- `scripts/verify-quick.mjs`
- `scripts/__tests__/ci-parity.test.ts`
- Existing quick-verification command tests
- `docs/learnings.md`

## Notes / decisions

- 2026-11-09 — Definition only carried by TICKET-062 after independent review identified the repeated omission. No harness implementation is included in that PR.

## Activity log

- 2026-11-09 — new → backlog — divine
- 2026-11-10 — backlog → todo — divine
- 2026-11-10 — todo → claimed — divine (codex)
- 2026-11-10 — todo → in_progress — divine (codex)
- 2026-11-10 — Thirteen focused command/parity tests pass after seven initial failing regressions. Full1860-test suite and quick verification pass; independent review clean. Final CI and PR evidence: `docs/plans/TICKET-226-pr.md`, PR153.
- 2026-11-10 — in_progress → in_review — divine (codex)
