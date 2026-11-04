# TICKET-131 — 2026-11-03

Owner divine; agent codex; branch TICKET-131; develop base 0e6247c630c4d8962eb01b3c8bc2ef0817268e47. Managed stack wedding-b3e2c85303e2; app21010/browser21011.

Implemented e2e/guest.spec.ts and scripts/test-guest-journey.ts. Real invitation attendance, companion name/meal, signed read-only pass, image/PDF downloads, return/edit/reload and stale cutoff rejection are asserted against synthetic local database fixtures on mobile and desktop. Cleanup retires only owned invitation IDs and preserves append-only RSVP history. Ephemeral signing keys stay in the runner process tree.

Dev journey: 2 pass13.5s (existing cached metadata URL serialization warnings disclosed in first-browser.log). Production journey: 2 pass3.9s. Quick and production build pass. Full verify passes formatting/lint/types/unit/build and769browser165skip4.9m. Dedicated journey is not tagged smoke and must be run explicitly; no claim that default smoke covers it.

CI currently has no database in the browser job. A complete additional job is prepared in docs/reviews/TICKET-131/ci-proposal.md; CI modification needs explicit approval under AGENTS.md before applying. Ticket criterion remains unticked until both projects pass in CI. Next: receive approval, apply the reviewed job, run CI, then full t:pr transition. No product changes or physical-device release certification.

## CI authorization — 2026-11-03

User approved the exact proposed CI job. Applied it under jobs in .github/workflows/ci.yml with unchanged existing jobs and permissions. Resumed through CLI. Awaiting both project results from actual CI before ticking acceptance or moving to review.

## CI journey passed — 2026-11-03

Approved job126252318493 in run41732191620 passed on27e54fb38f9816fb2e13c7df5b457d82979c5cf5: both mobile and desktop tests,2passed7.4s. Retrieved completed job log via GitHub API to artifacts/TICKET-131/ci-journey.log. All acceptance criteria now proved; full local gate previously passed852unit55skip,769browser165skip. Next: enforced t:pr verification/transition, mark draft ready, await required CI and human merge. PR83 is the linked review.

## Review-gate investigation — 2026-11-03

The t:pr rerun failed seven existing invitation-pages focus assertions (762pass165skip). A serial rerun reproduced the failure. Diagnostics using the exact mobile route sequence showed /dev/invitation still rendering its streamed loading shell when the test pressed Tab: no links existed yet, activeElement was body and document.hasFocus became false. The final failure screenshot showed loaded content only because it arrived after Tab.

Added an explicit visible level-one heading assertion after each route navigation, before theme/accessibility/focus checks. All previous assertions remain. This makes the test wait for the intended page instead of testing an empty loading shell. Verification is ongoing; initial full-gate success does not supersede this later failure. Failure traces/logs remain under artifacts/TICKET-131/failed-review and focus-isolated.log. The isolated DB was stopped; restart failed while Docker stayed healthy, making fallback loading delays reproducible. No other stack was altered.

Readiness correction verified: all26 invitation-page checks pass on mobile and desktop in1.2minutes with the database still unavailable. No previous assertions, timeouts or retries changed. Next rerun full t:pr on the corrected test.

## Corrected full gate passed — 2026-11-03

Full t:pr passed on b3dd899 after the streaming-readiness assertion; CLI moved ticket to in_review in fb5d1b6 and updated PR83. Prior failed traces remain disclosed. The test-only correction preserves every previous assertion; all26focused checks passed under the same database-outage conditions. Final GitHub CI on the published head and human merge remain required. No PR83 merge exception exists.

## Approved merge completed — 2026-11-04

The user explicitly approved PR83's merge. Rechecked head
4b77eb700599bd8486212181e7834efca6682ea7, develop base, mergeability and all five
successful CI jobs; GitHub reports no configured required-check list. Merged with
an exact-head guard at 00:06:37Z, merge commit e051979ea9da63bf5a429bb65ee874a92e3cc2c7.
The CLI verified the merge and marked TICKET-131 done; closure commit 5e3bbaf is pushed.
No production deployment or database application was performed. This supersedes
the earlier statement that no merge exception exists.
