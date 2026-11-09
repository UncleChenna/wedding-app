# Ticket

Ticket: TICKET-130

# Summary

Critical admission, token and ordering decisions previously had no enforced
coverage floor. **pnpm test now requires at least 95% lines and 95% branches in
each critical file**, including files no test imports. A covered file cannot hide
a weak neighbor.

# Changes

- Pin the coverage provider to installed Vitest 5.0.5 through pnpm, with the
  generated lockfile authorized under the owner's standing project permission.
- Cover all checkin/lib code, invitation token validation/generation, ordering
  validation and actual limit decisions. No global application threshold or ignore
  pragmas; reports live under ignored artifacts/coverage.
- Extract only pure cooldown/open-order/item-cap decisions. Replay checks, SQL
  aggregates, database time, table/menu locks and transaction order are preserved.
- Add behavioral cases for cooldown equality/fractions/precedence, item caps,
  snapshot refusal states and deterministic gate-list ordering.
- Prove actual coverage failure using passing test fixtures with a missed branch
  or entirely unimported file. Aggregate coverage remains above 95% in both cases,
  demonstrating per-file enforcement. All original tests/timeouts stay intact;
  two coverage workers avoid contention with image-rendering tests.

# Acceptance criteria and evidence

- [x] pnpm test fails below the critical-module floor. Real negative regressions
      exit nonzero despite passing assertions; the final complete suite passes with
      all ten critical files above both thresholds.

# Verification

Verified against merged develop 7250e4834ed2dc4c3a59c79c68b07f91d411b008.

- **Complete pnpm test: 1,410 passed, 156 skipped**, 85.78s. Skips remain explicitly
  opt-in suites; they are not represented as passed. Image tests pass with their
  original five-second timeouts.
- Final critical coverage: **98.54% lines, 99.28% branches, 100% functions** overall.
  Every included file clears 95% lines and branches. Lowest values: gate-token
  lines 96.36%; gate-print branches 95.83%.
- Real coverage-gate regression: **2 passed**, proving complete, missed-branch
  and unimported-file outcomes using the installed runner. Behavioral limit,
  snapshot and token tests also run in the full suite.
- Actual order SQL suite: **22 passed**, including concurrent submissions/replay,
  mixed station limits, cooldown and item caps. Managed Supabase startup failed
  auxiliary health checks before migration and was stopped with backup preserved.
  A fresh loopback-only PostgreSQL **16.14** fallback on the guarded owned port
  began with zero public tables, applied unchanged migrations and synthetic seed,
  then ran the suite. It is now stopped. This is not Supabase Auth/realtime or
  exact PostgreSQL 17 certification; CI separately uses PostgreSQL 17.
- Independent review: no blocking findings in extraction semantics, thresholds,
  negative-gate behavior or the stronger aggregate-masking regression.
- Final verify:quick: lint and types passed; no changed source files remained for
  the related-test selector. The complete 1,410-test result above is separate evidence.
- Earlier validation exposed image contention, the existing CI-parity mismatch
  and a hook test observing an active local lockfile exception. The two-worker
  run, merged TICKET-221 repair and revocation of the consumed exception resolved
  these. The authorization record was archived unchanged; the original hook suite
  then passed 46 tests. No hook/test/timeout was weakened.
- Reviewable logs and per-file coverage: docs/reviews/TICKET-130/. CI's complete
  pnpm verify remains the required merge gate.

# Risks and rollout

Development-only dependency; no migration, policy, external message or production
operation. Coverage does not prove transaction correctness: real database and
release tests remain mandatory. Revert the dependency, configuration and pure
extraction together to roll back. Lockfile generation used pnpm; its exact-path
authorization is preserved locally. No collaborator service or data was changed.

# Screenshots

N/A: no UI, styling, copy or interaction change.

# UI checklist

N/A for visual/device requirements. No client-boundary, QR, font, theme or route
changes. Verification and unrun cases are listed above; no release approval is
implied.

# Harness changes, if any

pnpm test now enforces critical coverage, inherited by existing full verification
and CI. verify:quick remains the fast lint/types/related-test check. No CI workflow,
hooks or security checks were weakened or skipped.
