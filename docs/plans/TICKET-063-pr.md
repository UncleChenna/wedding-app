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
- TICKET-065 is now verified merged and marked done. All software acceptance
  criteria are proved; physical release checks remain explicitly separate.

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
  Independent review inspected all 72 desktop captures with no layout blocker;
  exact-head CI remains outstanding.

# Risks and rollout

Offline admission mutation, outbox and synchronization remain mandatory in
TICKET-066. No physical phones, WhatsApp, one-metre operator checks or fresh
Lighthouse/CLS measurements are certified here; existing release gates remain.
No new dependencies or migrations. No production database application.
Rollback the feature commit to remove the manual route/UI; existing receipt evidence
is preserved. The local native database checks do not certify Supabase Auth/Realtime.

# Screenshots

See docs/reviews/TICKET-063/{mobile,desktop}: matches, cached-selection, choose-count,
uncertain, duplicate and replaced, for every theme and width. All 144 captures have been visually inspected: 72 mobile by the implementation
review and 72 desktop by an independent reviewer, with no material layout issue.

# UI checklist

Automated all-theme accessibility, responsive overflow and real navigation/permission
recovery pass. Physical-device and performance release checks remain unverified.
Cached results clearly state that entry was not recorded. No offline admission is claimed.

# Harness changes, if any

The stale result=manual wording now follows the established input-method contract.
The existing CI admission runner includes the manual journey; no checks are removed.

# Current-base integration

Develop eb14549758ac20fdb286325c7aa57ce42605b564 integrated conflict-free as
fe785d7. The three incoming0030 migration/journal files were byte-identical to
develop; their authorization record uses the user's standing full-project
authority. No database was changed by this integration. Earlier local evidence
remains attributed to its original base. Combined quick verification passes lint
and types (no changed source since integration); final combined CI is pending.
The original arm's-length requirement is preserved unchecked in TICKET-201,
which blocks both release tickets, under the approved preview exception.

Final dependency integration: develop2a0cf958adf7614c69758753bc35d8d5ea18aa5b
merged conflict-free as eb854c7. Decoder changes are the independently reviewed
repair whose complete hosted CI passed before merge. Combined manual-cache,
snapshot boundary and decoder regression tests:37passed (2.50s). Normal merge
hooks and ticket validation pass; final PR-head CI remains required before merge.
No repeated unchanged broad local suite or physical-device pass is claimed.

### Inherited scanner recovery regression

The first final CI run passed six required jobs but found a stale expectation
for the former manual-help anchor. The updated test now exercises actual named
search and focus, returns to camera, and retains permission/QR/privacy/role and
revocation checks. Rebuilt exact runner: mobile36.6s, desktop36.1s, both pass.
Fresh final CI is still required after the pending CI-policy base integration.
