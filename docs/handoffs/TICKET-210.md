# TICKET-210 handoff — 2026-11-01

Owner divine; agent codex; branch TICKET-210; status in_progress.
Base c9edef6cb137a194f9c215fc5b61b08488a54aa0.
Worktree .worktrees/TICKET-210; project wedding-154df1d979db; app29070/browser29071.
Definitions40d2dcb and start3421372 pushed.

## Scope and authority

User answered the explicit unchanged209-definition-copy request with “merge the ticket and continue”.209 has no PR and exists only as an uncommitted definition in025. The stated interpretation was to carry that unchanged definition so210 can proceed. SHA256 f824de87d90f8a083c4970f79e397c77e68308faf3365c2e99870b8095354d24 matches source/copies. No209 implementation or source-worktree edits were made.
PR64 publication commitc48a57f includes209/210 definitions and blocked evidence. The same unchanged209 definition accompanies210 solely for numbering validation.

## State

No runtime/test changes yet: git diff c9edef6 -- src e2e next.config.ts is empty. Open a baseline draft PR and let existing Linux CI run before pushing anything that would cancel it.
Plan: docs/plans/2026-11-01-TICKET-210.md.
PR body: docs/plans/TICKET-210-pr.md.

## Evidence / next actions

PR64 CI41252361212, PR65 CI41254671961 and PR66 CI41270521817 report the same Adaora font-shift value0.0001711703703703704. Baseline causality remains unproven.
Build baseline; compare against existing104 production build with controlled font delays. Inspect sources/resource timing; maintain zeroCLS, swap, visible text and all themes. Do not merely enable a retry or loosen tests.
Use caffeinate -is for verification only: pmset proved maintenance sleep caused unrelated15-minute stalls on110.
No baseline build/server started at this handoff checkpoint. Database isolated stack is running.

## 2026-11-01 investigation update

PR67 published at5857b5750a48584392892bce2df7d3fc115b94f9. Baseline CI41279198910 still running; do not cancel it by pushing before terminal. Build60049 passed. Baseline server4504 and comparison server96182 stopped (exit130).

Both production builds have identical results across twelve theme/width pairs. Glyph origins move despite stationary blocks; actual macOS CLS sources are preview links atwide widths. Evidence: docs/reviews/TICKET-210. First diagnostic matcher was incorrect; uncontrolled output preserved and excluded.

Candidate: two invitation component class changes, new e2e/invitation-font-swap.spec.ts. Regression12failed beforefix; focused62passed afterward. Strengthened final test includes zeroCLS/link origins/loadingstate. Full verify session8985 running, artifacts/TICKET-210/verify.log. Twelve screenshots inspected. Do not duplicate verification.

Next: collect local/baseline terminal results, run serial production Lighthouse, update review/PR evidence, commit/push candidate after baseline terminal, require final-head CI. Do not merge64/65/66 or incomplete67. Ticket remainsin_progress.

## Confirmed baseline and local gate

Baseline CI41279198910 finished FAIL:573passed,135skipped,2failed (both dark-theme envelope tests and retries; exact Adaora CLS0.0001711703703703704). Log: artifacts/TICKET-210/baseline-ci-failed.log. This confirms merged develop already contains the same failure.

Candidate full verification session8985 finished PASS:514unit/26skip;599browser/135skip. All strengthened delayed-font assertions pass. Subsequently expanded existing first/replay/keyboard test to375/768/1280; final focused session13655 running, artifacts/TICKET-210/final-focused.log. Runtime source unchanged since full gate. Final-head CI must cover expanded matrix. Baseline CI is now terminal, so publishing no longer cancels it.

## Wider-heading regression — 1 November 2026

Candidate fed18ea CI41280253622 finished FAIL:609 passed,135 skipped,6 failed. The original Adaora failure is gone. Expanded1280px coverage identifies the centred “Two stories.” line as another moving source (dark-theme envelope tests and delayed-font checks in all four themes). Log: artifacts/TICKET-210/candidate-ci-failed.log. The new origin assertion fails all four1280px cases locally before the headline fix (headline-red.log).

The headline now has a stable left origin in a centred maximum32rem column. The delayed-font test also measures both headline lines and emits actual shift sources on failure. Build88771 passes; focused97721 passes all78 checks (headline-focused.log). All12 refreshed invitation screenshots visually inspected. Full verification, updated performance and Linux CI for this second candidate remain pending; previous successful local full/performance results apply to fed18ea only. Physical-device release gate TICKET-201 remains mandatory.
