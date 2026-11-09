# Ticket

Ticket: TICKET-130

# Summary

Critical admission, token and ordering decisions previously had no enforced
coverage floor. `pnpm test` now checks at least 95% lines and branches for each
critical file, including files no test imports. A covered file cannot hide a weak
neighbor. This draft awaits integration of TICKET-221's existing CI-parity repair
and final combined verification.

# Changes

- Pin the coverage provider to the installed Vitest 5.0.5 version through pnpm;
  generated lockfile authorized under the owner's standing project permission.
- Cover all checkin/lib code, invitation token validation/generation, ordering
  validation and actual limit decisions. No global application threshold or ignore
  pragmas; reports live under ignored `artifacts/coverage`.
- Extract only pure cooldown/open-order/item-cap decisions; retain replay checks,
  SQL aggregates, database time, table/menu locks and transaction order unchanged.
- Add behavioral cases for cooldown equality/fractions/precedence, item caps,
  credential snapshot refusal states and deterministic gate-list ordering.
- Prove actual coverage failure using passing test fixtures with a missed branch
  or entirely unimported file. Keep all original tests and timeouts; cap coverage
  workers at two to avoid instrumentation competing with image rendering.

# Acceptance criteria and evidence

- [ ] `pnpm test` enforces the 95% floor: configured and independently reviewed;
      real negative-gate regressions pass. Final full integrated run remains pending.

# Verification

- Behavior-first limit tests initially failed because the extracted module did not
  exist. After implementation, boundary tests pass.
- Initial strict coverage exposed gaps in snapshot refusals, gate sorting and
  cooldown wording; new behavioral tests close them without exclusions.
- Critical suite: 132 passed; all ten included files clear both 95% thresholds.
  Aggregate 98.50% lines, 99.27% branches ; 100% functions.
- Actual negative-gate plus limit suite: 9 passed. Covered fixture exits 0;
  missed-branch and unimported-file fixtures each exit 1 although assertions pass.
- Image+critical suite serially under coverage: 134 passed in 15.94s with original
  five-second image timeouts.
- Quick lint/types passed ; 39 related tests passed, 29 database tests skipped.
- Initial full V8 run: 1,382 passed, 153 skipped, three failures: known TICKET-221
  chromium/WebKit CI parity mismatch and two image timeouts under worker contention.
  Final two-worker full-suite run remains outstanding.
- Two-worker diagnostic on develop `1f619b05`: **1,407 passed, 156 skipped**;
  image tests and all coverage thresholds passed. Two failures remained: the known
  parity mismatch and a hook test observing the active local lockfile exception.
  After the generated lockfile was committed, the consumed authorization was
  archived unchanged and its active exception revoked. The unchanged hook suite
  then passed **46 tests**. No test, hook or timeout was weakened; final integrated
  full-suite confirmation is still required.
- Actual order SQL regression: **22 passed** in 1.57s, including concurrent
  submission/replay, mixed station limits, cooldown and item caps. Managed Supabase
  startup failed auxiliary health checks before migrations; it was stopped with
  backup preserved. A fresh, loopback-only native PostgreSQL **16.14** fallback on
  the same guarded owned port started with zero public tables, applied unchanged
  migrations and synthetic seed, then ran the suite. It is now stopped with logs
  retained. This is not Supabase Auth/realtime or exact PostgreSQL 17 certification;
  CI separately uses PostgreSQL 17. No collaborator service or data was touched.
- Reviewable logs: `docs/reviews/TICKET-130/`. The negative-gate test now also proves
  both aggregate metrics remain above 95% when each per-file failure is detected.
- Independent review found no blocking issue in extraction semantics, threshold
  configuration, unimported-file coverage or real failure regressions.

# Risks and rollout

Development-only coverage dependency, no database migration/policy, external
messages or production change. Coverage is not proof of transaction correctness:
existing database concurrency tests remain mandatory. Revert the dependency,
configuration and pure extraction together to roll back. Generated lockfile was
produced by pnpm; exact-path authorization is recorded locally.

# Screenshots

N/A: no UI, styling, copy or interaction change.

# UI checklist

N/A for visual/device requirements. No client-boundary, QR, font, theme or route
changes. Verification and remaining unrun checks are listed above; no release
approval is implied.

# Harness changes, if any

`pnpm test` now enforces the critical coverage gate, inherited by existing full
verification and CI. `verify:quick` remains the fast lint/types/related-test check.
No CI workflow, hooks or security checks are weakened or skipped.
