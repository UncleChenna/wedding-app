---
id: TICKET-210
title: Eliminate invitation font-swap shifts after integration
epic: design-system
status: in_progress
priority: high
estimate: M
labels: [frontend, test]
module: theming
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-210
pr: ""
created: 2026-10-31
updated: 2026-11-01
started: 2026-11-01
completed: ""
reason: ""
resume_to: ""
---

# TICKET-210: Eliminate invitation font-swap shifts after integration

## Context

TICKET-104 PR64 CI41252361212 fails the unchanged envelope zero-CLS assertion for Midnight & Champagne and Emerald Night, including retry. Adaora's block is identified as a shift source; one recorded value is0.0001711703703703704. PR104 adds icon metadata but no font or invitation markup changes. Establish causality rather than assuming the failure is unrelated. [Design principles](../docs/design-principles.md) require zero load shift.

## Scope

Compare merged develop c9edef6cb137a194f9c215fc5b61b08488a54aa0 with PR104, controlling font load timing. Diagnose the interaction of merged envelope/font work and async metadata; fix the actual moving content or loading behavior in the appropriate ticket. Record the baseline, failing and fixed traces. If104 is causal, fix it there rather than misclassifying the regression.

## Out of scope

Raising CLS thresholds, hiding late text, disabling animations or tests, increasing timeouts to conceal failures, and claiming physical device QA. Separate local QR/stepper timeout observations are evidence to investigate if reproducible, not permission to weaken assertions.

## Acceptance criteria

- [x] Controlled baseline-versus-104 comparison identifies the cause with actual layout-shift entries and font timing.
- [x] A regression fails before the fix and passes afterward for both affected themes; preserve zero CLS and approved typography/reduced motion.
- [ ] All four themes pass envelope first/repeat visit, keyboard and delayed-font checks at375/768/1280.
- [ ] Full verification and final-head CI pass; retain every failed run and any unresolved device/performance limits.

## Test plan

Unit: any new pure logic. Browser: envelope tests, delayed-font scenarios, typography and all-theme captures. Run pnpm verify and final-head CI. Distinguish screenshot/transport timeouts from actual measured layout shifts; never call a retry alone the fix.

## Files likely touched

src/modules/theming/components/fonts.ts, src/modules/theming/font-fallbacks.css, invitation typography, metadata only if causal, e2e/envelope.spec.ts and ticket-specific evidence.

## Notes / decisions

2026-11-01: PR65 CI41254671961 and PR66 CI41270521817 also report the same Adaora shift value; compare the unchanged develop baseline before attributing causality.

2026-10-31: Created from observed PR64 CI failure. No diagnosis or fix is claimed yet. Original logs remain in TICKET-104 artifacts; its draft body/handoff records both local timeout runs and hosted CLS failures.

## Activity log

- 2026-10-31 — new → todo — divine
- 2026-11-01 — todo → claimed — divine (codex)
- 2026-11-01 — todo → in_progress — divine (codex)

2026-11-01: Baseline CI41279198910 reproduces the exact Adaora shift in both dark themes, including retries. Controlled baseline/104 measurements match across all12 pairs. Fixed stable text/link origins; initial regression12failed, final focused78passed; local full gate514unit/26skip and599browser/135skip. Lighthouse99/100/100 Performance,100 Accessibility,0CLS. Review: docs/reviews/TICKET-210/README.md. Candidate CI41280253622 pending; final criterion remains unchecked.
