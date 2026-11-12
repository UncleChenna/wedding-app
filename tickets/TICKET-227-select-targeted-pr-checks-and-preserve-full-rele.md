---
id: TICKET-227
title: Select targeted PR checks and preserve full release verification
epic: foundations
status: in_progress
priority: high
estimate: L
labels: [infra, test]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-227
pr: ""
created: 2026-11-12
updated: 2026-11-12
started: 2026-11-12
completed: ""
reason: ""
resume_to: ""
---

# TICKET-227: Select targeted PR checks and preserve full release verification

## Context

The owner approved targeted pull-request CI on 12 November 2026 so routine changes get relevant checks while releases retain complete verification. This supports the PRD testing and deployment requirements without removing existing suites.

## Scope

- Select tests from exact pull-request base/head changes, including renamed and deleted paths; fail closed for shared, configuration or unknown scope.
- Always lint/typecheck and run affected unit tests; run small UI smoke and relevant auth, database, scanner and offline integration suites.
- Keep explicit successful gates for deliberately non-applicable suites and preserve full release/manual verification and historical repair proof.
- Separate PR-text edits from implementation CI cancellation, preserving base-change verification.
- Update canonical verification documentation and portable workflows.

## Out of scope

- Product features, dependencies, paid services, weakened assertions or release/device QA exemptions.

## Acceptance criteria

- [x] Exact committed PR changes select dependency-aware unit tests, including deleted/renamed files; missing or ambiguous inputs select full verification.
- [x] Every PR runs lint/types; UI and sensitive integration mappings have executable selection regressions.
- [x] Required gates reject failed/cancelled selected jobs and distinguish intentionally unselected jobs from actual test execution.
- [x] Release/manual and explicit full PR modes run existing full suites; historical repair reconciliation cannot accept targeted-only proof.
- [x] PR body/title edits cannot cancel implementation checks; base changes still trigger verification.
- [x] Canonical docs/skills describe targeted PR checks and full release gates, with selector, parity and gate tests passing.

## Test plan

- Unit: real Git base/head fixtures for commits, renames, deletion, unknown paths and dependency selection; explicit gate outcome truth tables.
- Integration: workflow parity, historical repair provenance and full-mode/PR event regressions.
- Hosted CI: exact-head checks for this workflow change run full mode; independently review selectors and workflow expressions before merge.

## Files likely touched

- `.github/workflows/`, `scripts/`, relevant harness tests, canonical collaboration docs and skills.

## Notes / decisions

- 2026-11-12: Explicit owner authorization covers this CI policy change. Tests remain available and full release verification remains mandatory.

- 2026-11-12: Implemented exact-revision selection, conservative full fallbacks, explicit required gates and full repair proof. Focused regressions, quick gate and normal hooks pass. Independent reviews found no remaining blockers after JSON and metadata fixes. Final hosted CI remains required before merge.

## Activity log

- 2026-11-12 — new → todo — divine
- 2026-11-12 — todo → claimed — divine (codex)
- 2026-11-12 — todo → in_progress — divine (codex)
