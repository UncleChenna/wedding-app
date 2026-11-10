# Ticket

Ticket: TICKET-063

# Summary

Build manual guest lookup and admission for people without a QR and operators
whose camera permission is denied. This draft contains the authenticated server
flow and isolated search UI; scanner/offline integration remains unfinished.

# Changes

- Bounded accent/case/token-order and single-typo name matching across primary and
  tag-along names, capped household results and no directory response for empty input.
- Strict gate-only POST boundary with bounded streaming request body, same-origin
  checks, minimal validated output, no-store headers and post-read session recheck.
- Explicit plan for same admission/retry flow and offline read-only cache lookup.
  Five verdicts remain unchanged; manual is input-method metadata, not a verdict.
- Minimal name-only search, current eligibility read and zero-person manual
  observations reuse the verified logging contract. Manual admission reuses the
  existing locked transaction and expiry checks, without fabricating a QR.
- Receipt replay binds input method; legacy null QR evidence remains untouched.
- Search UI discards obsolete responses, keeps cached selections read-only after
  reconnect, and disables navigation while an admission outcome is uncertain.

# Acceptance criteria and evidence

- Search normalization, primary/tag-along matching and bounded long labels: ten unit tests pass.
- Auth/privacy/request boundary: four unit tests pass.
- Still required: actual manual observation/admission database evidence, camera
  recovery integration, authorized offline search, browser/UI matrix and final gates.
- TICKET-062 is merged; working ahead of TICKET-065. Keep draft until it merges.

# Verification

Both new suites failed before their implementation modules existed; all13 tests
now pass. Quick verification passes lint, strict types and13 related tests after
correcting fixture-only inferred types. Independent foundation source review is
clean. Additional focused tests cover manual intent retries, receipt-method
binding, shared eligibility, authenticated adapter, late-response fencing and
read-body timeout. Scoped lint and strict types pass. The follow-up independent
review found and verified the long-household-label correction. No database or
browser validation yet.

# Risks and rollout

The authenticated POST route exists; scanner UI integration is pending. Offline entry mutation, outbox
and synchronization remain mandatory in TICKET-066; cached lookup here cannot
claim admission. No new dependencies, migrations or production changes applied.

# Screenshots

Pending actual UI implementation and all-theme browser verification.

# UI checklist

Pending; no completed UI or physical-device checks claimed.

# Harness changes, if any

Clarifies the ticket's stale result=manual criterion to the established input
metadata contract. No harness implementation changes.
