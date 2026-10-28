# TICKET-030 — 28 October 2026, 19:10 UTC

Owner divine; agent codex; branch TICKET-030. Base develop f7e8fac048514058030d28d7b3a61f168de014f9. [Draft PR54](https://github.com/UncleChenna/wedding-app/pull/54), ledger in_review. Implementation 061137a, review evidence 2023ccd, CLI review transition 91e4ccd. User permits verified merges, but physical MFA QA deferral is still unanswered.

## Result

Server verifies live identity, exact allowlist, matching signed claims, verified TOTP factor and AAL2. Protected content checks precede JSX production; layout guards also protect navigation. MFA enrolment/challenge, manual key/QR, recovery guidance, no-referrer/noindex headers and local TOTP configuration are implemented. Bootstrap sign-in/sign-out/MFA actions intentionally accept AAL1, without access to wedding data; future business actions must use withAdminAccess themselves. No migration, RLS, dependency or lockfile changes. Shared QR geometry retains encoding/quiet zone and is reviewed through /dev/theme. See docs/admin-mfa.md.

## Verification

- Red guard tests first failed on the missing module, then all 16 new guard/MFA tests passed.
- Full pnpm verify: format, lint, types, 446 unit tests / 16 opt-in skips, build, 481 browser checks / 129 conditional skips passed.
- Required t:pr repeated the complete gate successfully with the same counts, then pushed in_review and PR metadata.
- Real isolated email/TOTP flow: four tests pass including wrong/foreign factors, AAL2 entry, restoring AAL1, a fresh returning challenge, sign-out and CLS=0.
- MFA matrix: two tests pass, 60 screenshots (five states × four themes × three widths), axe/44px/overflow/keyboard/QR decode. Shared showcase: 12 production captures with all long slices. All contact sheets inspected; docs/reviews/TICKET-030/README.md contains the evidence.
- CI40685274231 passed all required jobs at exact head2023ccd3bcba60639922e9c5ab22416a6fbeeb87. Later metadata/docs commits require their own CI before any merge.
- Physical iOS/Android authenticator scanning and native keyboard checks are NOT VERIFIED. Review is CHANGES REQUESTED for release approval, not a claim of device compatibility.

## Failures resolved and operational notes

A raw-response regression caught protected child content serialized before a layout redirect; data-producing admin components now guard before JSX. Supabase timers during prerender require connection() before reads and unstable_rethrow for framework exceptions. The first browser test incorrectly expected a success message after automatic navigation; it now asserts the actual admin destination.

The visual matrix twice stalled in animation.finished after resize. A scoped, bounded finite-animation completion assertion plus browser focus resolved it without weakening axe; propose centralizing diagnostics in a separate maintenance ticket. Public route tests raced streamed admin redirects: they now await the expected sign-in URL and field. The oversized all-theme auth form test was split by route/theme, preserving every assertion. Focused rerun passed138 / skipped106.

A duplicate t:pr run failed after macOS sleep/wake cycles stretched browser operations into minutes (426 pass,55 fail,129 skip; elapsed3.1h). pmset logs confirmed repeated sleep. Retried the unchanged gate with command-scoped caffeinate -i; all481 browser checks passed in2.7minutes. No timeout, test or hook was weakened.

Project wedding-8ed5c59b2273; app31310, browser31311, API31300, DB31301. Local stack is being stopped with backup preserved at handoff. Early failed tests may have left disposable fixture factors; successful runs remove only their own fixture factor. Never commit real setup keys or traces; review images use a labelled public example key/QR.

## Next action

Keep PR54 draft until physical device evidence or the pending explicit QA deferral arrives. If deferral approved, create the promised human release-blocking QA ticket through t:new and document the exception before closure. Check final-head CI and merge with the exact SHA only once this condition is resolved. Then use t:move done; do not discard completion metadata.

TICKET-040 is independently ready and next in the live queue. Prior tickets006,025,029 are done/merged; their stacks are stopped and CLI completion-file changes must be preserved.
