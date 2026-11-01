# TICKET-210 handoff — 1 November 2026

Owner divine; agent codex; branch TICKET-210; ledger status **in_review**.
PR: https://github.com/UncleChenna/wedding-app/pull/67
Worktree: .worktrees/TICKET-210. Base: c9edef6cb137a194f9c215fc5b61b08488a54aa0.
Project wedding-154df1d979db; app port29070; browser port29071.

## Current checkpoint

The final implementation is f6c22c06c5808fb8371a34bd1871378f364447a5. Its local and Linux gates pass. Evidence commit5d35904 was verified again by the normal t:pr command, which pushed status commit61e1e74 and recorded PR67 in ticket metadata. All acceptance criteria are ticked. The PR was still draft immediately after t:pr; mark it ready after publishing this handoff, then require final-head checks before integration.

Current source is unchanged from f6c22c0. Only the handoff is being finalised. No owned application/browser command remains running. The isolated database is still running.

## Authority

The user approved verified ticket PR merges and asked to continue the backlog. Use that standing approval only after the required checks pass; do not merge failed candidates or waive TICKET-201.

The latest reply “merge the ticket and continue” answered the unchanged209-definition-copy request.209 had no PR or implementation to merge. Only its unchanged definition was copied from025 into104 and210, under the stated interpretation. SHA256 f824de87d90f8a083c4970f79e397c77e68308faf3365c2e99870b8095354d24 matched. No025 edits or209 implementation were copied.104 publicationc48a57f contains the prerequisite definitions.

## Diagnosis and history

- Definitions40d2dcb and start3421372 were pushed before investigation.
- Baseline5857b57 preserves develop runtime/tests. CI41279198910 failed both dark-theme envelope tests and retries:573 passed,135 skipped,2 failed. Exact Adaora CLS0.0001711703703703704; block bounds stayed unchanged.
- Controlled font-delay comparison between baseline and existing104 production build found identical results across12 theme/width pairs.104 source/tests/config remain unchanged from00ae18b. Text origins move under centring even when block geometry is stable. Raw geometry, font timings and shift entries: docs/reviews/TICKET-210/font-comparison.json.
- Initial diagnostic matcher was incorrectly escaped; uncontrolled output is retained locally and excluded. Corrected matcher **/*.woff2 holds fonts until fallback paint.
- Initial name regression failed12/12 locally. fed18ea stabilised names and preview links; local full gate514unit/26skip and599browser/135skip passed.
- Expanded CI41280253622 found another centred heading shift at1280px:609 passed,135 skipped,6 failed. Original name failure was resolved. The new headline-origin regression failed4/4 locally before the second fix.
- f6c22c0 also stabilises the headline and records shift sources in failures. Names/headline retain stable left origins in centred18rem/32rem columns; preview links reserve14rem. Fonts, wrapping, copy, motion and data handling are unchanged.

## Final verification

- Full local gate29473:514 unit passed/26 skipped;615 browser passed/135 skipped.
- Linux CI41281345380:all jobs pass, same test counts.
- Final focused97721:78 passed.
- t:pr29165:full gate passed again (514/26;615/135), pushed evidence and transitioned to in_review.
- Standard screenshots41522:24 passed. All12 affected invitation captures visually inspected and committed.
- Final production Lighthouse valid runs:96/97/96 Performance,100/100/100 Accessibility,0/0/0 CLS. Initial NO_NAVSTART trace collection error retained separately. Earlier99/100/100 measurements belong to fed18ea and are historical.
- Passing controlled trace38202:1 passed, saved at artifacts/TICKET-210/fixed-trace/invitation-font-swap--smok-19cd2--origins-emerald-night-1280-desktop/trace.zip.
- Baseline and first-candidate failure reports downloaded successfully into artifacts/TICKET-210/baseline-ci-report and first-candidate-ci-report.
- Review and compact performance evidence: docs/reviews/TICKET-210/README.md and performance.json. PR body: docs/plans/TICKET-210-pr.md.

Physical iOS/Android and WhatsApp checks are NOT verified. The existing TICKET-201 preview exception permits preview delivery while preserving the mandatory guest-release gate. No threshold, timeout, retry, hook or assertion was loosened.

## Next action

Publish this handoff, mark PR67 ready, and verify all required checks on the exact final head. Merge only that verified head under the standing authorization, then close through the ticket CLI. Retain completion evidence and stop the owned database with backup preservation when finished; do not discard dirty or unmerged worktree metadata.

After210 integrates, resume104 first: explicitly update its base from fetched develop, preserve canonical209/210 definitions when resolving any add/add conflict, and rerun its own verification. Then revisit blocked109/110. Do not call their older failed runs passing.

Use process-scoped caffeinate -is for verification: maintenance sleep was independently confirmed to cause15-minute browser stalls in earlier work. Do not change global power settings or test timeouts.
