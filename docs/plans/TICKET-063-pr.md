# Ticket

Ticket: TICKET-063

# Summary

Gate operators can recover from denied camera permission or a missing QR by searching
primary and tag-along names. Live selections use the existing locked admission
transaction; cached selections remain explicitly read-only until TICKET-066.

# Changes

- Bounded accent/case/token-order and single-typo matching, capped household results,
  bounded display labels, and no directory response for empty input.
- Gate-only POST boundary with bounded streaming input, same-origin checks,
  validated minimal output, no-store headers and post-read session recheck.
- Manual observations and admissions preserve the five verdicts and bind authenticated
  actor/device plus input_method=manual. Replay retains exact intent identity;
  historical null QR receipts remain compatible without rewriting evidence.
- Scanner mode switching stops camera tracks. Pending or uncertain admission blocks
  navigation; lost committed responses can be retried without a second increment.
- Cached search shares the scanner's session, deadline, invalidation generation and
  denial boundaries. Known changes cannot fall back to an unsafe cache. Reconnection
  does not turn an old cached selection into an admission form.
- The existing admission journey runner includes the new manual recovery scenario.

# Acceptance criteria and evidence

- Pure search: twelve tests, 100% scoped lines/branches, including normalization,
  primary/tag-along matching, ranking and bounded multi-primary labels.
- Real SQL: seven tests pass, including manual observation, concurrent exact-intent
  retry, input-method conflict and authorization after row-lock waits.
- Real authenticated browser: mobile and desktop both pass. Denied camera recovery,
  companion lookup, offline read-only selection, fresh online selection, lost-response
  retry, replacement refusal and camera-track shutdown are exercised.
- Four themes × three widths (375/768/1280) × six states × two projects produce
  144 screenshots. Browser assertions enforce no horizontal overflow and zero axe
  violations. Physical arm's-length/device review remains a release requirement.
- Working against merged TICKET-065 implementation; keep draft while its completion
  evidence is being reconciled and this PR's final verification is outstanding.

# Verification

- Production build: passed on develop base 3b6c04e71413fe51c884238c013135fb0231f1f0.
- Isolated PostgreSQL migration: passed, using only this worktree's guarded loopback
  port 35681. Database stopped afterward with its data retained.
- RUN_ONLINE_ADMISSION_DB_TESTS=1 online-admission.integration.test.ts: 7 passed.
- test-online-admission runner, manual journey: 2 passed in 31.0 seconds.
- First browser run failed on an incorrect fixture locator expecting a bare table
  number; corrected to the actual visible “Table N” label, retaining all assertions.
- Quick verification: lint and 24 related tests passed; a test-only TypeScript cast
  failed. Corrected to an optional track property with an explicit nonempty guard;
  final quick rerun passes lint, types and 24 related tests.
- Official full unit/coverage suite: 2,009 passed, 207 conditional skips; 98.82%
  critical lines and 99.08% branches.
- Independent source review found no blocker in the shared cache integration.
  Final screenshot review and exact-head CI remain outstanding.

# Risks and rollout

Offline admission mutation, outbox and synchronization remain mandatory in
TICKET-066. No physical phones, WhatsApp, one-metre operator checks or fresh
Lighthouse/CLS measurements are certified here; existing release gates remain.
No new dependencies or migrations. No production database application.
Rollback the feature commit to remove the manual route/UI; existing receipt evidence
is preserved. The local native database checks do not certify Supabase Auth/Realtime.

# Screenshots

See docs/reviews/TICKET-063/{mobile,desktop}: matches, cached-selection, choose-count,
uncertain, duplicate and replaced, for every theme and width. Mobile's 72 captures
have been visually inspected; desktop independent review is pending.

# UI checklist

Automated all-theme accessibility, responsive overflow and real navigation/permission
recovery pass. Physical-device and performance release checks remain unverified.
Cached results clearly state that entry was not recorded. No offline admission is claimed.

# Harness changes, if any

The stale result=manual wording now follows the established input-method contract.
The existing CI admission runner includes the manual journey; no checks are removed.
