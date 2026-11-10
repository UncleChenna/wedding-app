# Ticket

Ticket: TICKET-063

# Summary

Build manual guest lookup and admission for people without a QR and operators
whose camera permission is denied. This draft currently contains the search and
authenticated response contracts; integration and UI remain unfinished.

# Changes

- Bounded accent/case/token-order and single-typo name matching across primary and
  tag-along names, capped household results and no directory response for empty input.
- Strict gate-only POST boundary with bounded streaming request body, same-origin
  checks, minimal validated output, no-store headers and post-read session recheck.
- Explicit plan for same admission/retry flow and offline read-only cache lookup.
  Five verdicts remain unchanged; manual is input-method metadata, not a verdict.

# Acceptance criteria and evidence

- Search normalization and primary/tag-along matching: nine unit tests pass.
- Auth/privacy/request boundary: four unit tests pass.
- Still required: actual server adapter and manual observation/admission persistence,
  camera recovery UI, authorized offline search, browser/UI matrix and final gates.
- Working ahead of TICKET-062/TICKET-065. Keep draft until both merge.

# Verification

Both new suites failed before their implementation modules existed; all13 tests
now pass. Quick verification passes lint, strict types and13 related tests after
correcting fixture-only inferred types. Independent foundation source review is
clean. No database or browser validation yet.

# Risks and rollout

No production route is wired at this checkpoint. Offline entry mutation, outbox
and synchronization remain mandatory in TICKET-066; cached lookup here cannot
claim admission. No new dependencies, migrations or production changes applied.

# Screenshots

Pending actual UI implementation and all-theme browser verification.

# UI checklist

Pending; no completed UI or physical-device checks claimed.

# Harness changes, if any

Clarifies the ticket's stale result=manual criterion to the established input
metadata contract. No harness implementation changes.
