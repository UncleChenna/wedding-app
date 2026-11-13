# Ticket

Ticket: TICKET-231

# Summary

Recover retained offline admissions after gate credentials expire without restoring gate authority. The original browser exports minimal records; an authorized admin explicitly reviews/imports them, then returns a signed receipt that clears only exact committed evidence.

# Changes

- Add bounded strict export/import contracts and two-step admin authorization rechecked within each record transaction.
- Preserve original UUID, actor and device provenance through existing reconciliation; atomically append recovery audit digests and scan-log notes before acknowledgement.
- Add RLS-enabled append-only `scan_recovery_audits` with generated migrations0032/0033. No browser policies or existing admission guards change. The generated trigger declaration is falsely classified destructive by the hook; its exact path authorization is recorded under the user’s standing instruction, without changing the hook.
- Add public local-device recovery and protected admin review pages with entry/return links. Public recovery grants no staff/admin authority and uploads no records until an administrator explicitly imports them.
- Sign receipts using a separate HMAC domain on the existing server secret. Online receipt verification validates expiry; local cleanup matches complete record identity before acknowledging.
- Make TICKET-231 a direct release154 prerequisite; extend existing authenticated admin and scan-sync test lanes.

# Acceptance criteria and evidence

Implementation is in progress. Strict contracts, authorization, receipt integrity and durable reconciliation are covered. Actual browser export/import/cleanup, UI evidence, seed-repeat verification and final review remain before readiness.

# Verification

- Seven focused unit tests pass: bounded schemas, secret/duplicate rejection, explicit review, same-origin/admin enforcement, streamed-size cancellation, HMAC tampering/expiry and signed exact acknowledgement.
- Fifteen actual scan-sync database tests pass, including revoked historical actor recovery, repeated import idempotency, rejected UUID conflict audit, authority loss and audit failure rollback.
- Migrations applied twice; row counts identical; RLS enabled on all27 public tables.
- Production build passes after correcting a test helper type. Initial browser run exposed an ambiguous status selector; scoped repair retains its assertion. The complete journey now passes mobile and desktop (2 tests,12.0s), including duplicate import, conflicting-record retention, forged receipt rejection, reload and idempotent exact cleanup. An intervening mobile MFA enrollment stall is preserved as an unclaimed failed run.
- Independent critical-path review found no blocking authorization, transaction, signed-receipt or evidence-retention issue.

# Risks and rollout

Apply generated additive0032/0033 before the new API; no production application is performed here. Audit rows are append-only. Local synthetic seed reset temporarily disables only the named audit guard in the existing transaction, restores it before inserts, and must be verified before readiness. Concurrent migration numbering must be reconciled against latest develop before merge.

Recovery files are untrusted claims, so an admin must check the original device/operator and explicitly approve. Deleted original staff/device rows cannot be reconstructed automatically. Full-origin loss cannot restore evidence. Receipts expire after24 hours; replaying the same reviewed import regenerates a receipt without double-counting. Pending/rejected/mismatched records remain local; do not clear browser data. Physical-phone file transfer remains release QA.

# Screenshots

Pending actual authenticated browser evidence under `docs/reviews/TICKET-231/`.

# UI checklist

Existing shared buttons, theme tokens, staff-size text, labelled file controls and return links are used. Automated keyboard/accessibility/mobile inspection and screenshots are pending; physical devices are unverified.

# Harness changes, if any

Existing admin journey runner gains focused `--recovery` mode and includes this journey by default. Existing scan-sync database lane includes the new transactional cases. No checks, hooks or test assertions were weakened.
