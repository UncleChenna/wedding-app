# Critical logic coverage

`pnpm test` runs the complete Vitest suite with coverage. Each critical file must
reach **95% lines and 95% branches**; strong coverage in one file cannot hide a gap
in another. A coverage failure exits nonzero, so the existing `pnpm verify` and CI
gate enforce it without a separate optional command.

The scope follows TICKET-130 and the PRD testing plan:

- All executable `src/modules/checkin/lib/**/*.ts`: token validation, admission,
  pass eligibility, URLs, credential snapshots, scanner verification and gate
  print projection. New files matching this glob are included even when unimported.
- `src/modules/invitations/lib/token.ts`: invitation token validation/generation.
- `src/modules/ordering/lib/order.ts`: submitted input bounds and order identities.
- `src/modules/ordering/lib/order-limits.ts`: actual cooldown, open-order and
  per-item decisions, called at the same positions in the locked server transaction.

No global application threshold or coverage-ignore directives are added. Explicit
include patterns also measure unimported files. Reports are ignored local output
under `artifacts/coverage/`; full JSON, summary JSON and terminal results are emitted,
including when tests fail. The matching installed Vitest coverage provider is pinned
and installed through pnpm. Test workers are capped at two to avoid V8 instrumentation
contending with image-rendering tests; assertions and test timeouts are unchanged.

`scripts/__tests__/critical-coverage.test.ts` runs the real installed coverage checker
on temporary fixtures. A fully covered fixture passes; a missed branch and an entirely
unimported file each fail while their test assertions pass. This checks the failure
behavior rather than merely asserting configuration text.

Coverage is not a security proof. Database locks, cross-instance concurrency and
SQL counting still require the existing opt-in database tests. The extracted policy
does not change query order, replay handling, locks or transaction boundaries.
Physical device and release checks remain independent requirements.
