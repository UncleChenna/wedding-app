---
id: TICKET-239
title: Diagnose and stabilize offline scanner reconciliation evidence
epic: quality
status: in_progress
priority: high
estimate: M
labels: [test]
module: checkin
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-239
pr: ""
created: 2026-11-13
updated: 2026-11-13
started: 2026-11-13
completed: ""
reason: ""
resume_to: ""
---

# TICKET-239: Diagnose and stabilize offline scanner reconciliation evidence

## Context

PR113 CI run43388307715 failed the real two-scanner journey at camera result and reconnection. Existing failure artifacts contain no runtime state, so do not infer product correctness or increase timeouts without diagnosis. PRD requires retained offline admissions and canonical conflict reconciliation.

## Scope

- Capture bounded synthetic-only scanner phase, UI and sync status diagnostics before context cleanup.
- Reproduce and fix demonstrated product or harness synchronization defects.
- Preserve actual QR decoding, fifty scans, reload journals, replay and canonical conflict assertions.

## Out of scope

- Weakened assertions, fabricated admissions, timeout inflation or physical-device certification.

## Acceptance criteria

- [ ] Failure evidence identifies scanner/scan phase and bounded sync/UI state without credentials or tokens.
- [ ] Identified defect has a focused regression; unexplained failures remain disclosed.
- [ ] Both real scanner projects pass all fifty-scan retention,100event reconciliation and replay assertions.

## Test plan

- End-to-end: Inspect failedCI artifacts and repeat the existing isolated production-browser journey.
- Unit: Focused regression for the demonstrated cause; independent review.

## Files likely touched

- `e2e/offline-gate.spec.ts`
- Relevant scanner module only if evidence proves a product defect.

## Notes / decisions

2026-11-13: Existing traces/screenshots explicitly disabled, and custom contexts close before failure snapshot capture; first repair is diagnostic coverage.

## Activity log

- 2026-11-13 — new → todo — divine
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
